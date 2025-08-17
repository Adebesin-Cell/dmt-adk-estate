import { env } from "@/env";
import { createTool } from "@iqai/adk";
import { PropertySource } from "@prisma/client";
import type { z } from "zod";
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

type CommonSearch = z.infer<typeof CommonSearchSchema>;

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
			typeof pl.geometry?.location?.lat === "number"
				? pl.geometry.location.lat
				: null;
		const lng =
			typeof pl.geometry?.location?.lng === "number"
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
		if (!key || !seen.has(key)) {
			if (key) seen.add(key);
			out.push(it);
		}
	}
	return out;
}

async function fetchBingListings(q: string): Promise<PropertyDraft[]> {
	const endpoint = "https://bing-web-search1.p.rapidapi.com/v7.0/search";
	const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`, {
		headers: {
			"X-RapidAPI-Key": env.RAPIDAPI_KEY,
			"X-RapidAPI-Host": "bing-web-search1.p.rapidapi.com",
		},
	});
	if (!res.ok) {
		throw new Error(
			`Bing (RapidAPI) search failed: ${res.status} ${res.statusText}`,
		);
	}
	const data: BingSearchResponse = await res.json();
	const pages = data.webPages?.value ?? [];
	return toBingListings(pages, "BING_RAPIDAPI");
}

async function fetchGMapsPlaces(q: string): Promise<PropertyDraft[]> {
	if (!env.GOOGLE_MAPS_KEY) return [];
	const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
		q,
	)}&key=${encodeURIComponent(env.GOOGLE_MAPS_KEY)}`;

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(
			`Google Maps search failed: ${res.status} ${res.statusText}`,
		);
	}
	const data: GMapsTextSearchResponse = await res.json();
	const results = data.results ?? [];
	return toGMapsListings(results);
}

function buildQuery(query: CommonSearch["query"]) {
	const locations = Array.isArray(query.locations)
		? query.locations.filter(Boolean)
		: [];

	if (locations.length === 0) return "";

	const tokens: string[] = [];

	const intent =
		query.listingType === "rent" ? "homes for rent" : "homes for sale";
	tokens.push(intent);

	tokens.push(locations.join(" "));

	if (typeof query.bedroomsMin === "number")
		tokens.push(`${query.bedroomsMin}+ bedroom`);
	if (typeof query.budgetMaxMajor === "number")
		tokens.push(`under ${query.budgetMaxMajor}`);
	if (typeof query.budgetMinMajor === "number")
		tokens.push(`over ${query.budgetMinMajor}`);

	return tokens.join(" ").trim();
}

export const searchWebFallback = createTool({
	name: "search_web_fallback",
	description:
		"Fallback: combine Bing Web Search (via RapidAPI) and Google Maps Places Text Search to surface relevant pages/places.",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const limit = Math.max(1, Math.min(paging?.limit ?? 20, 50));

		const q = buildQuery(query);
		if (!q) {
			return {
				listings: [],
				note: "Web search needs a location (e.g., city/area/ZIP). Please provide at least one location.",
			};
		}

		// Run providers in parallel but isolate failures.
		const [bingRes, gmapsRes] = await Promise.allSettled([
			fetchBingListings(q),
			fetchGMapsPlaces(q),
		]);

		const bing = bingRes.status === "fulfilled" ? bingRes.value : [];
		const gmaps = gmapsRes.status === "fulfilled" ? gmapsRes.value : [];

		const merged = dedupeByUrl([...bing, ...gmaps]).slice(0, limit);

		if (merged.length === 0) {
			// Surface a helpful note rather than throwing; lets the Hub offer adjustments.
			return {
				listings: [],
				note: "No relevant web results found. Try broadening the area or relaxing filters (price/bedrooms).",
			};
		}

		return { listings: merged };
	},
});
