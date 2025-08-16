import { env } from "@/env";
import { createTool } from "@iqai/adk";
import { Currency, type Prisma, PropertySource } from "@prisma/client";
import { CommonSearchSchema } from "./_schema";

type PropertyDraft = Omit<
	Prisma.PropertyUncheckedCreateInput,
	"id" | "createdAt" | "updatedAt"
>;

export const searchZillow = createTool({
	name: "search_zillow",
	description: "Fetch Zillow listings via RapidAPI Zillow endpoint.",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const url = "https://zillow56.p.rapidapi.com/propertyExtendedSearch";
		const params = new URLSearchParams({
			location: query.locations?.[0] ?? "Los Angeles",
			home_type: "Houses",
			page: "1",
		});
		if (query.budgetMinMajor != null)
			params.set("minPrice", String(query.budgetMinMajor));
		if (query.budgetMaxMajor != null)
			params.set("maxPrice", String(query.budgetMaxMajor));
		if (query.bedroomsMin != null)
			params.set("bedsMin", String(query.bedroomsMin));

		const res = await fetch(`${url}?${params.toString()}`, {
			headers: {
				"X-RapidAPI-Key": env.RAPIDAPI_KEY,
				"X-RapidAPI-Host": "zillow56.p.rapidapi.com",
			},
		});
		if (!res.ok)
			throw new Error(`Zillow API failed: ${res.status} ${res.statusText}`);
		const data = await res.json();

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const listings: PropertyDraft[] = (data.props ?? []).map((p: any) => ({
			source: PropertySource.ZILLOW,
			sourceId: p.zpid ? String(p.zpid) : null,
			url: p.zpid ? `https://www.zillow.com/homedetails/${p.zpid}_zpid/` : null,
			address: p.address ?? null,
			city: p.city ?? null,
			country: "US",
			lat: typeof p.latitude === "number" ? p.latitude : null,
			lng: typeof p.longitude === "number" ? p.longitude : null,
			priceMinor:
				typeof p.price === "number" ? Math.round(p.price * 100) : null,
			currency: Currency.USD,
			metadata: p,
			createdAt: undefined,
			updatedAt: undefined,
		}));

		return { listings: listings.slice(0, paging.limit) };
	},
});
