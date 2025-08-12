import { createTool } from "@iqai/adk";
import { Currency, PropertySource } from "@prisma/client";
import { load } from "cheerio";
import { z } from "zod";

const Schema = z.object({
	query: z.object({
		locations: z
			.array(
				z
					.string()
					.describe(
						"Region subdomains for Craigslist, e.g., 'losangeles', 'london'",
					),
			)
			.describe("List of target Craigslist regions to search in"),
		budgetMinMajor: z
			.number()
			.nullable()
			.optional()
			.describe("Minimum budget in major currency units (e.g., USD)"),
		budgetMaxMajor: z
			.number()
			.nullable()
			.optional()
			.describe("Maximum budget in major currency units (e.g., USD)"),
		bedroomsMin: z
			.number()
			.nullable()
			.optional()
			.describe("Minimum number of bedrooms"),
	}),
	paging: z
		.object({
			limit: z
				.number()
				.default(24)
				.describe("Maximum number of listings to return"),
			offset: z
				.number()
				.default(0)
				.describe("Number of listings to skip before returning results"),
		})
		.describe("Pagination options for search results"),
});

export const searchCraigslist = createTool({
	name: "search/craigslist",
	description:
		"Scrape Craigslist housing listings for a given region subdomain and return Prisma-ready Property-like objects.",
	schema: Schema,
	fn: async (input) => {
		const { query, paging } = input;

		const region = (query.locations?.[0] || "losangeles")
			.toLowerCase()
			.replace(/\s+/g, "");
		const base = `https://${region}.craigslist.org`;

		const params = new URLSearchParams();
		if (query.budgetMinMajor != null)
			params.set("min_price", String(query.budgetMinMajor));
		if (query.budgetMaxMajor != null)
			params.set("max_price", String(query.budgetMaxMajor));
		if (query.bedroomsMin != null)
			params.set("min_bedrooms", String(query.bedroomsMin));

		const url = `${base}/search/rea?${params.toString()}`;
		const res = await fetch(url);
		if (!res.ok)
			throw new Error(
				`Craigslist request failed: ${res.status} ${res.statusText}`,
			);

		const html = await res.text();
		const $ = load(html);

		const items: Array<{
			source: PropertySource;
			sourceId: string;
			url: string | null;
			address: string | null;
			city: string | null;
			country: string | null;
			lat: number | null;
			lng: number | null;
			priceMinor: number | null;
			currency: Currency | null;
			metadata: Record<string, unknown> | null;
		}> = [];

		$("li.cl-search-result").each((_, el) => {
			const sourceId =
				String($(el).attr("data-pid") || $(el).attr("data-id") || "") || "";
			if (!sourceId) return;

			const title = $(el).find(".title").text().trim() || null;
			const priceTxt = $(el)
				.find(".price")
				.first()
				.text()
				.replace(/[^\d.]/g, "");
			const href = $(el).find("a").attr("href") || null;
			const hood =
				$(el).find(".location").text().trim().replace(/[()]/g, "") || null;

			const priceMajor = priceTxt ? Number(priceTxt) : Number.NaN;
			const priceMinor = Number.isFinite(priceMajor)
				? Math.round(priceMajor * 100)
				: null;
			const absoluteUrl = href?.startsWith("http")
				? href
				: href
					? `${base}${href}`
					: null;

			items.push({
				source: PropertySource.CRAIGSLIST,
				sourceId,
				url: absoluteUrl,
				address: title,
				city: hood,
				country: null,
				lat: null,
				lng: null,
				priceMinor,
				currency: Currency.USD,
				metadata: { rawTitle: title, region },
			});
		});

		return { listings: items.slice(0, paging.limit) };
	},
});
