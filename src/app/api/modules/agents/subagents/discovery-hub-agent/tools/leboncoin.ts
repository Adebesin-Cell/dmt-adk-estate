import { env } from "@/env";
import { createTool } from "@iqai/adk";
import { Currency, PropertySource } from "@prisma/client";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

type LbcAd = {
	list_id?: number | string;
	url?: string;
	subject?: string;
	location?: {
		city?: string;
		lat?: number;
		lng?: number;
	};
	price?: number;
};

type LbcSearchResponse = {
	ads?: LbcAd[];
};

type LbcFilters = {
	category: { id: string };
	keywords: { text: string };
	ranges?: {
		price?: {
			min?: number;
			max?: number;
		};
	};
};

export const searchLeboncoin = createTool({
	name: "search_leboncoin",
	description: "Fetch Leboncoin listings via official API.",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const url = "https://api.leboncoin.fr/finder/search";

		const filters: LbcFilters = {
			category: { id: "9" },
			keywords: { text: query.locations.join(" ") },
		};

		if (query.budgetMinMajor != null || query.budgetMaxMajor != null) {
			filters.ranges = {
				price: {
					min: query.budgetMinMajor ?? 0,
					max: query.budgetMaxMajor ?? 99_999_999,
				},
			};
		}

		const body = {
			filters,
			limit: paging.limit,
			offset: paging.offset,
		};

		const res = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.LEBONCOIN_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			throw new Error(`Leboncoin API failed: ${res.status} ${res.statusText}`);
		}

		const data: LbcSearchResponse = await res.json();

		const listings: PropertyDraft[] = (data.ads ?? []).map(
			(p): PropertyDraft => {
				const sourceId =
					typeof p.list_id === "number" || typeof p.list_id === "string"
						? String(p.list_id)
						: null;

				const lat = typeof p.location?.lat === "number" ? p.location.lat : null;
				const lng = typeof p.location?.lng === "number" ? p.location.lng : null;

				const priceMinor =
					typeof p.price === "number" ? Math.round(p.price * 100) : null;

				return {
					source: PropertySource.LEBONCOIN,
					sourceId,
					url: p.url ?? null,
					address: p.subject ?? null,
					city: p.location?.city ?? null,
					country: "FR",
					lat,
					lng,
					priceMinor,
					currency: Currency.EUR,
					metadata: p, // safe: typed LbcAd
				};
			},
		);

		return { listings };
	},
});
