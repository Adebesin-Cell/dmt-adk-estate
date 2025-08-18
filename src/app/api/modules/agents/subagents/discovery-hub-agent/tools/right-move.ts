import { env } from "@/env";
import { createTool } from "@iqai/adk";
import { Currency, PropertySource } from "@prisma/client";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

const RM_URL = "https://rightmove3.p.rapidapi.com/search";
const RM_HEADERS = {
	"X-RapidAPI-Key": env.RAPIDAPI_KEY,
	"X-RapidAPI-Host": "rightmove3.p.rapidapi.com",
};

function toMinor(price: any): number | null {
	// Handles number, string ("450000"), formatted string ("£450,000"),
	// or nested { amount } / { value } shapes commonly seen in feeds.
	if (price == null) return null;
	if (typeof price === "number" && Number.isFinite(price))
		return Math.round(price * 100);
	const nested = price?.amount ?? price?.value ?? price?.raw ?? null;
	if (typeof nested === "number" && Number.isFinite(nested))
		return Math.round(nested * 100);
	const s =
		typeof price === "string"
			? price
			: typeof nested === "string"
				? nested
				: null;
	if (!s) return null;
	const num = Number(s.replace(/[^0-9.]/g, ""));
	return Number.isFinite(num) ? Math.round(num * 100) : null;
}

function rmLink(
	id?: string | number | null,
	channel: "RES_BUY" | "RES_LET" = "RES_BUY",
): string | null {
	if (id == null) return null;
	return `https://www.rightmove.co.uk/properties/${String(id)}#/?channel=${channel}`;
}

export const searchRightmove = createTool({
	name: "search_rightmove",
	description: "Fetch Rightmove listings via RapidAPI Rightmove endpoint.",
	schema: CommonSearchSchema,
	maxRetryAttempts: 1,
	fn: async ({ query, paging }) => {
		console.log("🏡 Starting Rightmove search...", {
			locations: query.locations,
			budgetRange: [query.budgetMinMajor, query.budgetMaxMajor],
			bedroomsMin: query.bedroomsMin,
			requestedLimit: paging?.limit,
		});

		const locations = query.locations?.filter(Boolean) ?? [];
		if (locations.length === 0) {
			console.log("❌ Rightmove search failed: No locations provided");
			return {
				listings: [],
				note: `Rightmove search needs a location or location identifier (e.g., "Manchester" or a Rightmove locationIdentifier).`,
			};
		}

		type Channel = "RES_BUY" | "RES_LET";
		const channel: Channel = "RES_BUY";

		const channelToType: Record<Channel, "SALE" | "RENT"> = {
			RES_BUY: "SALE",
			RES_LET: "RENT",
		};

		const type = channelToType[channel];
		console.log(
			`🔍 Processing ${locations.length} location(s) for ${type}: ${locations.join(", ")}`,
		);

		const perLocation = locations.map(async (loc, index) => {
			console.log(
				`📍 [${index + 1}/${locations.length}] Searching location: "${loc}"`,
			);

			const params = new URLSearchParams({
				locationIdentifier: loc,
				type,
				index: "0",
			});

			// Only apply user-supplied filters
			if (query.budgetMinMajor != null)
				params.set("minPrice", String(query.budgetMinMajor));
			if (query.budgetMaxMajor != null)
				params.set("maxPrice", String(query.budgetMaxMajor));
			if (query.bedroomsMin != null)
				params.set("minBedrooms", String(query.bedroomsMin));

			const url = `${RM_URL}?${params.toString()}`;

			try {
				console.log(`🌐 Making API request for "${loc}"...`);
				const res = await fetch(url, { headers: RM_HEADERS });

				if (!res.ok) {
					console.log(
						`❌ API error for "${loc}": HTTP ${res.status} ${res.statusText}`,
					);
					throw new Error(`HTTP ${res.status} ${res.statusText}`);
				}

				const data = await res.json();
				const props = Array.isArray(data?.properties) ? data.properties : [];
				console.log(`✅ Retrieved ${props.length} properties for "${loc}"`);

				const items: PropertyDraft[] = props.map((p: any) => ({
					source: PropertySource.RIGHTMOVE,
					sourceId: p.id ? String(p.id) : null,
					url: p.detailUrl ?? rmLink(p.id, channel),
					address: p.displayAddress ?? p.address ?? null,
					city: p.city ?? null,
					state: p.county ?? p.region ?? null,
					postalCode: p.postcode ?? p.postalCode ?? null,
					country: "GB",
					lat: typeof p.latitude === "number" ? p.latitude : null,
					lng: typeof p.longitude === "number" ? p.longitude : null,
					priceMinor: toMinor(p.price),
					currency: Currency.GBP,
					metadata: p,
				}));

				return items;
			} catch (e: any) {
				console.error(`❌ Rightmove search failed for "${loc}":`, e.message);
				return [];
			}
		});

		console.log("⏳ Waiting for all location searches to complete...");
		const merged = (await Promise.all(perLocation)).flat();
		console.log(
			`📊 Raw results: ${merged.length} total properties before deduplication`,
		);

		const seen = new Map<string, PropertyDraft>();
		for (const item of merged) {
			const key =
				item.sourceId ?? `${item.address}|${item.city}|${item.lat}|${item.lng}`;
			if (!seen.has(key)) seen.set(key, item);
		}

		const limit = Math.max(1, Math.min(paging?.limit ?? 20, 100));
		const listings = Array.from(seen.values()).slice(0, limit);

		console.log(
			`✨ Rightmove search complete: ${listings.length} unique properties (limit: ${limit})`,
		);

		return { listings };
	},
});
