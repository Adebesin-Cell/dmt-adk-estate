import { env } from "@/env";
import { createTool } from "@iqai/adk";
import { Currency, PropertySource } from "@prisma/client";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

export const searchRightmove = createTool({
	name: "search_rightmove",
	description: "Fetch Rightmove listings via RapidAPI Rightmove endpoint.",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const url = "https://rightmove3.p.rapidapi.com/search";
		const params = new URLSearchParams({
			locationIdentifier: query.locations?.[0] ?? "London",
			type: "SALE",
			index: "0",
		});
		if (query.budgetMinMajor != null)
			params.set("minPrice", String(query.budgetMinMajor));
		if (query.budgetMaxMajor != null)
			params.set("maxPrice", String(query.budgetMaxMajor));
		if (query.bedroomsMin != null)
			params.set("minBedrooms", String(query.bedroomsMin));

		const res = await fetch(`${url}?${params.toString()}`, {
			headers: {
				"X-RapidAPI-Key": env.RAPIDAPI_KEY,
				"X-RapidAPI-Host": "rightmove3.p.rapidapi.com",
			},
		});
		if (!res.ok)
			throw new Error(`Rightmove API failed: ${res.status} ${res.statusText}`);
		const data = await res.json();

		const listings: PropertyDraft[] = (data.properties ?? []).map((p: any) => ({
			source: PropertySource.RIGHTMOVE,
			sourceId: p.id ? String(p.id) : null,
			url: p.detailUrl ?? null,
			address: p.displayAddress ?? null,
			city: p.city ?? null,
			country: "UK",
			lat: typeof p.latitude === "number" ? p.latitude : null,
			lng: typeof p.longitude === "number" ? p.longitude : null,
			priceMinor:
				typeof p.price === "number" ? Math.round(p.price * 100) : null,
			currency: Currency.GBP,
			metadata: p,
			createdAt: undefined,
			updatedAt: undefined,
		}));

		return { listings: listings.slice(0, paging.limit) };
	},
});
