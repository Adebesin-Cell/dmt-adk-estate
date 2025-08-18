import { createTool } from "@iqai/adk";
import { Currency, PropertySource } from "@prisma/client";
import { load } from "cheerio";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

type FetchLike = typeof fetch;

const UA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function toAbsUrl(base: string, href?: string | null): string | null {
	if (!href) return null;
	try {
		// Handles absolute, protocol-relative, and relative paths
		return new URL(href, base).toString();
	} catch {
		return null;
	}
}

function parsePriceMinor(text: string | null | undefined): number | null {
	if (!text) return null;
	const digits = text.replace(/[^0-9.]/g, "");
	if (!digits) return null;
	const major = Number(digits);
	return Number.isFinite(major) ? Math.round(major * 100) : null;
}

function normalizeRegionSubdomain(input: string): string | null {
	if (!input) return null;
	// Accept known-good subdomains as-is (e.g., "sfbay", "newyork", "losangeles")
	// Strip whitespace and protocol/host noise if someone pasted a URL.
	const s = input
		.trim()
		.replace(/^https?:\/\//i, "")
		.replace(/\/.*$/, "") // drop path
		.replace(/\.craigslist\.org$/i, "") // drop domain suffix if present
		.replace(/\s+/g, "")
		.toLowerCase();
	// Basic sanity: only letters/numbers/hyphen allowed
	if (!/^[a-z0-9-]+$/.test(s)) return null;
	return s;
}

async function scrapeRegion(
	regionSubdomain: string,
	qs: URLSearchParams,
	fetchImpl: FetchLike = fetch,
): Promise<PropertyDraft[]> {
	console.log(`🏘️ Scraping Craigslist region: "${regionSubdomain}"`);

	const base = `https://${regionSubdomain}.craigslist.org`;
	const url = `${base}/search/rea?${qs.toString()}`; // "rea" = real estate for sale

	try {
		console.log(`🌐 Making request to: ${url}`);
		const res = await fetchImpl(url, {
			headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
		});

		if (!res.ok) {
			console.log(
				`❌ Craigslist request failed for "${regionSubdomain}": HTTP ${res.status} ${res.statusText}`,
			);
			throw new Error(
				`Craigslist request failed: ${res.status} ${res.statusText}`,
			);
		}

		const html = await res.text();
		console.log(
			`📄 Retrieved HTML for "${regionSubdomain}" (${html.length} characters)`,
		);

		const $ = load(html);
		const out: PropertyDraft[] = [];

		$("li.cl-search-result").each((_, el) => {
			const sourceId = String(
				$(el).attr("data-pid") || $(el).attr("data-id") || "",
			).trim();
			if (!sourceId) return;

			const title =
				$(el).find(".title, .posting-title").first().text().trim() || null;
			const hood =
				$(el)
					.find(".location, .nearby")
					.first()
					.text()
					.trim()
					.replace(/[()]/g, "") || null;
			const href =
				$(el).find("a").attr("href") ||
				$(el).find(".title a").attr("href") ||
				null;
			const absUrl = toAbsUrl(base, href);

			const priceText = $(el).find(".price").first().text() || null;
			const priceMinor = parsePriceMinor(priceText);

			out.push({
				source: PropertySource.CRAIGSLIST,
				sourceId,
				url: absUrl,
				address: title,
				city: hood,
				state: null,
				postalCode: null,
				country: null,
				lat: null,
				lng: null,
				priceMinor,
				currency: Currency.USD,
				metadata: { region: regionSubdomain, rawTitle: title },
			} as PropertyDraft);
		});

		console.log(`✅ Scraped ${out.length} listings from "${regionSubdomain}"`);
		return out;
	} catch (e: any) {
		console.error(`❌ Failed to scrape "${regionSubdomain}":`, e.message);
		throw e;
	}
}

export const searchCraigslist = createTool({
	name: "search_craigslist",
	description:
		"Scrape Craigslist housing listings for given region subdomain(s).",
	schema: CommonSearchSchema,
	maxRetryAttempts: 1,
	fn: async ({ query, paging }) => {
		console.log("📋 Starting Craigslist search...", {
			locations: query.locations,
			budgetRange: [query.budgetMinMajor, query.budgetMaxMajor],
			bedroomsMin: query.bedroomsMin,
			requestedLimit: paging?.limit,
		});

		const limit = Math.max(1, Math.min(paging?.limit ?? 20, 100));

		const rawRegions = Array.isArray(query.locations) ? query.locations : [];
		const regions = rawRegions
			.map(normalizeRegionSubdomain)
			.filter((r): r is string => Boolean(r));

		console.log(`🗂️ Raw locations: [${rawRegions.join(", ")}]`);
		console.log(`🔧 Normalized regions: [${regions.join(", ")}]`);

		if (regions.length === 0) {
			console.log(
				"❌ Craigslist search failed: No valid regions after normalization",
			);
			return {
				listings: [],
				note: `Craigslist search needs one or more region subdomains (e.g., "sfbay", "newyork").`,
			};
		}

		const qs = new URLSearchParams();
		if (query.budgetMinMajor != null) {
			qs.set("min_price", String(query.budgetMinMajor));
			console.log(`💰 Min price filter: $${query.budgetMinMajor}`);
		}
		if (query.budgetMaxMajor != null) {
			qs.set("max_price", String(query.budgetMaxMajor));
			console.log(`💰 Max price filter: $${query.budgetMaxMajor}`);
		}
		if (query.bedroomsMin != null) {
			qs.set("min_bedrooms", String(query.bedroomsMin));
			console.log(`🛏️ Min bedrooms filter: ${query.bedroomsMin}`);
		}

		console.log(`🔍 Processing ${regions.length} region(s) in parallel...`);

		const results: PropertyDraft[] = [];
		const seen = new Set<string>();

		const batches = await Promise.allSettled(
			regions.map((r, index) => {
				console.log(
					`📍 [${index + 1}/${regions.length}] Queuing region: "${r}"`,
				);
				return scrapeRegion(r, qs);
			}),
		);

		console.log("⏳ Processing scraping results...");

		let successfulRegions = 0;
		let failedRegions = 0;

		for (let i = 0; i < batches.length; i++) {
			const b = batches[i];
			const regionName = regions[i];

			if (b.status !== "fulfilled") {
				console.log(
					`❌ Region "${regionName}" failed: ${b.reason?.message || "Unknown error"}`,
				);
				failedRegions++;
				continue;
			}

			successfulRegions++;
			console.log(
				`✅ Region "${regionName}" succeeded with ${b.value.length} listings`,
			);

			for (const item of b.value) {
				const key = item.sourceId;
				if (!key) continue;
				if (seen.has(key)) {
					console.log(`🔄 Duplicate listing skipped: ${key}`);
					continue;
				}
				seen.add(key);
				results.push(item);
				if (results.length >= limit) break;
			}
			if (results.length >= limit) break;
		}

		console.log(
			`📊 Scraping summary: ${successfulRegions} successful, ${failedRegions} failed regions`,
		);
		console.log(
			`📋 Total unique listings: ${results.length} (limit: ${limit})`,
		);

		if (results.length === 0) {
			console.log("❌ No results found across all regions");
			return {
				listings: [],
				note: "No results found for the provided Craigslist regions/filters. Try widening the price range or checking the region subdomain.",
			};
		}

		console.log(
			`✨ Craigslist search complete: ${results.length} listings found`,
		);
		return { listings: results.slice(0, limit) };
	},
});
