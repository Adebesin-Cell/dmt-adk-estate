import { prisma } from "@/lib/integration/prisma";
import { createTool } from "@iqai/adk";
import { Currency, PropertySource } from "@prisma/client";
import { z } from "zod";
import type { PropertyDraft } from "./_schema";

export function createAddPropertiesTool(opts?: { dryRun?: boolean }) {
	const dryRun = !!opts?.dryRun;

	return createTool({
		name: "add_properties",
		description: dryRun
			? "TEST MODE: Validates and processes PropertyDraft listings but skips database insertion. Use this during testing to verify data structure and deduplication logic without persisting data."
			: "Save discovered property listings to the database. Automatically deduplicates based on source+sourceId/URL combinations and handles data normalization. Use this after collecting property search results from multiple sources to persist them for the user.",
		schema: z.object({
			listings: z
				.array(
					z.object({
						source: z
							.nativeEnum(PropertySource)
							.describe(
								"Property source platform (e.g., CRAIGSLIST, ZILLOW, RIGHTMOVE)",
							),
						sourceId: z
							.string()
							.nullish()
							.describe("Unique identifier from the source platform"),
						url: z
							.string()
							.nullish()
							.describe("Direct link to the property listing"),
						address: z
							.string()
							.nullish()
							.describe("Full property address or description"),
						city: z
							.string()
							.nullish()
							.describe("City or locality where property is located"),
						country: z
							.string()
							.nullish()
							.describe("Country code or name (e.g., 'US', 'UK', 'Germany')"),
						lat: z
							.number()
							.nullish()
							.describe("Latitude coordinate for property location"),
						lng: z
							.number()
							.nullish()
							.describe("Longitude coordinate for property location"),
						priceMinor: z
							.number()
							.nullish()
							.describe(
								"Property price in minor currency units (e.g., cents for USD, pence for GBP)",
							),
						currency: z
							.nativeEnum(Currency)
							.nullish()
							.describe("Currency of the price (USD, EUR, GBP)"),
						metadata: z
							.unknown()
							.nullish()
							.describe(
								"Additional property details as JSON object (bedrooms, bathrooms, sqft, etc.)",
							),
					}),
				)
				.describe(
					"Array of property listings to save. Each listing should have at minimum a source and either sourceId or url for deduplication.",
				),
		}),
		fn: async ({ listings }) => {
			console.log("Received listings for persistence:", listings.length);
			if (!listings.length) return { success: true, inserted: 0 };

			const unique: PropertyDraft[] = [];
			const seen = new Set<string>();
			let duplicatesSkipped = 0;

			for (const p of listings) {
				const key = `${p.source}:${p.sourceId ?? p.url ?? ""}`;
				if (seen.has(key)) {
					duplicatesSkipped++;
					continue;
				}
				seen.add(key);

				unique.push({
					...p,
					sourceId: p.sourceId ?? null,
					url: p.url ?? null,
					address: p.address ?? null,
					city: p.city ?? null,
					country: p.country ?? null,
					lat: p.lat ?? null,
					lng: p.lng ?? null,
					priceMinor: p.priceMinor ?? null,
					currency: p.currency ?? null,
					metadata: p.metadata ?? {},
				});
			}

			if (dryRun) {
				console.log(
					`🧪 add_properties(dryRun) would insert ${unique.length} unique properties (${duplicatesSkipped} duplicates filtered)`,
				);
				return {
					success: true,
					inserted: unique.length,
					duplicatesSkipped,
					dryRun: true,
				};
			}

			const result = await prisma.property.createMany({
				data: unique,
				skipDuplicates: true,
			});

			console.log(
				`✅ Persisted ${result.count} properties to database (${duplicatesSkipped} duplicates filtered)`,
			);

			return {
				success: true,
				inserted: result.count,
				duplicatesSkipped,
			};
		},
	});
}
