import { createTool } from "@iqai/adk";
import { Currency, PropertySource } from "@prisma/client";
import { load } from "cheerio";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

async function scrapeRegion(
	region: string,
	qs: URLSearchParams,
): Promise<PropertyDraft[]> {
	const base = `https://${region}.craigslist.org`;
	const res = await fetch(`${base}/search/rea?${qs.toString()}`);
	if (!res.ok)
		throw new Error(
			`Craigslist request failed: ${res.status} ${res.statusText}`,
		);

	const html = await res.text();
	const $ = load(html);
	const out: PropertyDraft[] = [];

	$("li.cl-search-result").each((_, el) => {
		const sourceId = String(
			$(el).attr("data-pid") || $(el).attr("data-id") || "",
		);
		if (!sourceId) return;

		const title = $(el).find(".title").text().trim() || null;
		const hood =
			$(el).find(".location").text().trim().replace(/[()]/g, "") || null;
		const href = $(el).find("a").attr("href") || null;
		const absUrl = href?.startsWith("http")
			? href
			: href
				? `${base}${href}`
				: null;
		const priceMajor = Number(
			$(el).find(".price").first().text().replace(/[^\d]/g, ""),
		);
		const priceMinor = Number.isFinite(priceMajor) ? priceMajor * 100 : null;

		out.push({
			source: PropertySource.CRAIGSLIST,
			sourceId,
			url: absUrl,
			address: title,
			city: hood,
			country: null,
			lat: null,
			lng: null,
			priceMinor,
			currency: Currency.USD,
			metadata: { region, rawTitle: title },
			createdAt: undefined,
			updatedAt: undefined,
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
		const qs = new URLSearchParams();
		if (query.budgetMinMajor != null)
			qs.set("min_price", String(query.budgetMinMajor));
		if (query.budgetMaxMajor != null)
			qs.set("max_price", String(query.budgetMaxMajor));
		if (query.bedroomsMin != null)
			qs.set("min_bedrooms", String(query.bedroomsMin));

		const all: PropertyDraft[] = [];
		for (const region of query.locations) {
			const regionKey = region.toLowerCase().replace(/\s+/g, "");
			try {
				const batch = await scrapeRegion(regionKey, qs);
				all.push(...batch);
			} catch (_) {
				// continue other regions
			}
		}
		return { listings: all.slice(0, paging.limit) };
	},
});
