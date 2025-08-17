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
	const base = `https://${regionSubdomain}.craigslist.org`;
	const url = `${base}/search/rea?${qs.toString()}`; // "rea" = real estate for sale
	const res = await fetchImpl(url, {
		headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
	});
	if (!res.ok) {
		throw new Error(
			`Craigslist request failed: ${res.status} ${res.statusText}`,
		);
	}

	const html = await res.text();
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

	return out;
}

export const searchCraigslist = createTool({
	name: "search_craigslist",
	description:
		"Scrape Craigslist housing listings for given region subdomain(s).",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const limit = Math.max(1, Math.min(paging?.limit ?? 20, 100));

		const rawRegions = Array.isArray(query.locations) ? query.locations : [];
		const regions = rawRegions
			.map(normalizeRegionSubdomain)
			.filter((r): r is string => Boolean(r));

		if (regions.length === 0) {
			return {
				listings: [],
				note: "Craigslist search needs one or more region subdomains (e.g., “sfbay”, “newyork”).",
			};
		}

		const qs = new URLSearchParams();
		if (query.budgetMinMajor != null)
			qs.set("min_price", String(query.budgetMinMajor));
		if (query.budgetMaxMajor != null)
			qs.set("max_price", String(query.budgetMaxMajor));
		if (query.bedroomsMin != null)
			qs.set("min_bedrooms", String(query.bedroomsMin));

		const results: PropertyDraft[] = [];
		const seen = new Set<string>();

		const batches = await Promise.allSettled(
			regions.map((r) => scrapeRegion(r, qs)),
		);

		for (const b of batches) {
			if (b.status !== "fulfilled") continue;
			for (const item of b.value) {
				const key = item.sourceId;
				if (!key) continue;
				if (seen.has(key)) continue;
				seen.add(key);
				results.push(item);
				if (results.length >= limit) break;
			}
			if (results.length >= limit) break;
		}

		if (results.length === 0) {
			return {
				listings: [],
				note: "No results found for the provided Craigslist regions/filters. Try widening the price range or checking the region subdomain.",
			};
		}

		return { listings: results.slice(0, limit) };
	},
});
