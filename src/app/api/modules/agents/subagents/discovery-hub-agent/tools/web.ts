import { env } from "@/env";
import { createTool } from "@iqai/adk";
import { PropertySource } from "@prisma/client";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

type BingWebPage = {
	name?: string;
	url?: string;
	snippet?: string;
};
type BingWebPagesBlock = {
	value?: BingWebPage[];
};
type BingSearchResponse = {
	webPages?: BingWebPagesBlock;
};

type GMapsPlace = {
	place_id: string;
	name?: string;
	formatted_address?: string;
	geometry?: { location?: { lat?: number; lng?: number } };
};
type GMapsTextSearchResponse = {
	results?: GMapsPlace[];
	status?: string;
};

function toBingListings(
	items: BingWebPage[],
	providerLabel = "BING",
): PropertyDraft[] {
	return items.map(
		(p, i): PropertyDraft => ({
			source: PropertySource.MANUAL,
			sourceId: String(i),
			url: p.url ?? null,
			address: p.name ?? null,
			city: null,
			country: null,
			lat: null,
			lng: null,
			priceMinor: null,
			currency: null,
			metadata: { snippet: p.snippet, provider: providerLabel },
		}),
	);
}

function toGMapsListings(places: GMapsPlace[]): PropertyDraft[] {
	return places.map((pl): PropertyDraft => {
		const placeUrl = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(
			pl.place_id,
		)}`;
		const lat =
			pl.geometry?.location?.lat !== undefined &&
			pl.geometry.location.lat !== null
				? pl.geometry.location.lat
				: null;
		const lng =
			pl.geometry?.location?.lng !== undefined &&
			pl.geometry.location.lng !== null
				? pl.geometry.location.lng
				: null;

		return {
			source: PropertySource.MANUAL,
			sourceId: pl.place_id,
			url: placeUrl,
			address: pl.name ?? pl.formatted_address ?? null,
			city: null,
			country: null,
			lat,
			lng,
			priceMinor: null,
			currency: null,
			metadata: {
				provider: "GOOGLE_MAPS",
				formatted_address: pl.formatted_address,
			},
		};
	});
}

function dedupeByUrl(items: PropertyDraft[]): PropertyDraft[] {
	const seen = new Set<string>();
	const out: PropertyDraft[] = [];
	for (const it of items) {
		const key = (it.url ?? "").toLowerCase();
		if (!key) {
			out.push(it);
			continue;
		}
		if (!seen.has(key)) {
			seen.add(key);
			out.push(it);
		}
	}
	return out;
}

async function fetchBingListings(q: string): Promise<PropertyDraft[]> {
	const res = await fetch(
		`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}`,
		{
			headers: { "Ocp-Apim-Subscription-Key": env.BING_SEARCH_KEY },
		},
	);
	if (!res.ok)
		throw new Error(`Bing search failed: ${res.status} ${res.statusText}`);
	const data: BingSearchResponse = await res.json();
	const pages = data.webPages?.value ?? [];
	return toBingListings(pages, "BING");
}

async function fetchGMapsPlaces(q: string): Promise<PropertyDraft[]> {
	if (!env.GOOGLE_MAPS_KEY) return [];
	const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
		q,
	)}&key=${encodeURIComponent(env.GOOGLE_MAPS_KEY)}`;
	const res = await fetch(url);
	if (!res.ok)
		throw new Error(
			`Google Maps search failed: ${res.status} ${res.statusText}`,
		);
	const data: GMapsTextSearchResponse = await res.json();
	const results = data.results ?? [];
	return toGMapsListings(results);
}

export const searchWebFallback = createTool({
	name: "search_web_fallback",
	description:
		"Fallback: combine Bing Web Search and Google Maps Places Text Search to surface relevant pages/places.",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const q = `homes for sale ${query.locations.join(" ")}`;

		const [bing, gmaps] = await Promise.all([
			fetchBingListings(q).catch(() => []),
			fetchGMapsPlaces(q).catch(() => []),
		]);

		const merged = dedupeByUrl([...bing, ...gmaps]);
		return { listings: merged.slice(0, paging.limit) };
	},
});
