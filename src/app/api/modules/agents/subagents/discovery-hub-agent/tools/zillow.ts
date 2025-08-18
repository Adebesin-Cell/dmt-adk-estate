import { env } from "@/env";
import { createTool } from "@iqai/adk";
import { Currency, type Prisma, PropertySource } from "@prisma/client";
import { CommonSearchSchema } from "./_schema";

type PropertyDraft = Omit<
	Prisma.PropertyUncheckedCreateInput,
	"id" | "createdAt" | "updatedAt"
>;

const ZILLOW_URL = "https://zillow56.p.rapidapi.com/propertyExtendedSearch";
const ZILLOW_HEADERS = {
	"X-RapidAPI-Key": env.RAPIDAPI_KEY,
	"X-RapidAPI-Host": "zillow56.p.rapidapi.com",
};

function toMinor(price: unknown): number | null {
	// Accept number or string like "450000" or "$450,000"
	if (price == null) return null;
	if (typeof price === "number" && Number.isFinite(price))
		return Math.round(price * 100);
	if (typeof price === "string") {
		const cleaned = price.replace(/[^0-9.]/g, "");
		const num = Number(cleaned);
		return Number.isFinite(num) ? Math.round(num * 100) : null;
	}
	return null;
}

function zillowLink(zpid?: string | number | null): string | null {
	if (zpid == null) return null;
	const id = String(zpid);

	return `https://www.zillow.com/homedetails/${id}_zpid/`;
}

export const searchZillow = createTool({
	name: "search_zillow",
	description: "Fetch Zillow listings via RapidAPI Zillow endpoint.",
	schema: CommonSearchSchema,
	maxRetryAttempts: 1,
	fn: async ({ query, paging }) => {
		console.log("🏠 Starting Zillow search...", {
			locations: query.locations,
			budgetRange: [query.budgetMinMajor, query.budgetMaxMajor],
			bedroomsMin: query.bedroomsMin,
			requestedLimit: paging?.limit,
		});

		const locations = query.locations?.filter(Boolean) ?? [];
		if (locations.length === 0) {
			console.log("❌ Zillow search failed: No locations provided");
			return {
				listings: [],
				note: `Zillow search requires a location. Please provide a city/ZIP (e.g., "Seattle, WA").`,
			};
		}

		console.log(
			`🔍 Processing ${locations.length} location(s): ${locations.join(", ")}`,
		);

		const requests = locations.map(async (loc, index) => {
			console.log(
				`📍 [${index + 1}/${locations.length}] Searching location: "${loc}"`,
			);

			const params = new URLSearchParams({
				location: loc,
				page: "1",
			});

			if (query.budgetMinMajor != null)
				params.set("minPrice", String(query.budgetMinMajor));
			if (query.budgetMaxMajor != null)
				params.set("maxPrice", String(query.budgetMaxMajor));
			if (query.bedroomsMin != null)
				params.set("bedsMin", String(query.bedroomsMin));

			const url = `${ZILLOW_URL}?${params.toString()}`;

			try {
				console.log(`🌐 Making API request for "${loc}"...`);
				const res = await fetch(url, { headers: ZILLOW_HEADERS });

				if (!res.ok) {
					console.log(
						`❌ API error for "${loc}": HTTP ${res.status} ${res.statusText}`,
					);
					throw new Error(`HTTP ${res.status} ${res.statusText}`);
				}

				const data = await res.json();
				const propsCount = data?.props?.length ?? 0;
				console.log(`✅ Retrieved ${propsCount} properties for "${loc}"`);

				const items: PropertyDraft[] = (data?.props ?? []).map((p: any) => ({
					source: PropertySource.ZILLOW,
					sourceId: p.zpid ? String(p.zpid) : null,
					url: zillowLink(p.zpid) ?? p.detailUrl ?? null,
					address: p.address ?? p.streetAddress ?? null,
					city: p.city ?? null,
					state: p.state ?? p.stateCode ?? null,
					postalCode: p.zipcode ?? p.postalCode ?? null,
					country: "US",
					lat: typeof p.latitude === "number" ? p.latitude : null,
					lng: typeof p.longitude === "number" ? p.longitude : null,
					priceMinor: toMinor(p.price),
					currency: Currency.USD,
					metadata: p,
				}));

				return items;
			} catch (e: any) {
				console.error(`❌ Zillow search failed for "${loc}":`, e.message);
				return [];
			}
		});

		console.log("⏳ Waiting for all location searches to complete...");
		const all = (await Promise.all(requests)).flat();
		console.log(
			`📊 Raw results: ${all.length} total properties before deduplication`,
		);

		const byId = new Map<string, PropertyDraft>();
		for (const item of all) {
			const key =
				item.sourceId ?? `${item.address}|${item.city}|${item.lat}|${item.lng}`;
			if (!byId.has(key)) byId.set(key, item);
		}

		const limit = Math.max(1, Math.min(paging?.limit ?? 20, 100));
		const listings = Array.from(byId.values()).slice(0, limit);

		console.log(
			`✨ Zillow search complete: ${listings.length} unique properties (limit: ${limit})`,
		);

		return { listings };
	},
});
