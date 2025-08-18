import fs from "node:fs";
import path from "node:path";
import type { PropertyDraft } from "@/app/api/modules/agents/subagents/discovery-hub-agent/tools/_schema";

type Dataset = Record<string, PropertyDraft[]>;

let CACHE: Dataset | null = null;
export function loadMockDataset(): Dataset {
	if (CACHE) return CACHE;
	const p = path.resolve(process.cwd(), "src/app/assets/data/properties.json");
	CACHE = JSON.parse(fs.readFileSync(p, "utf-8"));

	if (!CACHE) {
		throw new Error("Failed to load mock dataset");
	}
	return CACHE;
}

export type BasicQuery = {
	locations?: string[];
	budgetMinMajor?: number | null;
	budgetMaxMajor?: number | null;
	bedroomsMin?: number | null;
};

export function searchDataset(
	key: keyof Dataset | string,
	query: BasicQuery,
	limit: number,
): PropertyDraft[] {
	const ds = loadMockDataset();
	const items = (ds[key as string] ?? []).slice();

	const locs = (query.locations ?? [])
		.filter(Boolean)
		.map((s) => s.toLowerCase().replace(/\s+/g, ""));

	const filtered = items.filter((p) => {
		if (locs.length) {
			const hay = [p.city, p.country, p.address, (p as any)?.metadata?.region]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.replace(/\s+/g, "");
			if (!locs.some((t) => hay.includes(t))) return false;
		}
		if (typeof query.budgetMinMajor === "number" && p.priceMinor != null) {
			if (p.priceMinor < query.budgetMinMajor * 100) return false;
		}
		if (typeof query.budgetMaxMajor === "number" && p.priceMinor != null) {
			if (p.priceMinor > query.budgetMaxMajor * 100) return false;
		}
		if (typeof query.bedroomsMin === "number") {
			const beds = (p as any)?.metadata?.beds;
			if (typeof beds === "number" && beds < query.bedroomsMin) return false;
		}
		return true;
	});

	const seen = new Set<string>();
	const out: PropertyDraft[] = [];
	for (const it of filtered) {
		const key = it.sourceId ?? `${it.source}|${it.url}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(it);
		if (out.length >= limit) break;
	}
	return out;
}
