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
			? "Dry-run: accept PropertyDraft[] but do NOT write to DB."
			: "Persist discovered property listings into the database.",
		schema: z.object({
			listings: z.array(
				z.object({
					source: z.nativeEnum(PropertySource),
					sourceId: z.string().nullish(),
					url: z.string().nullish(),
					address: z.string().nullish(),
					city: z.string().nullish(),
					country: z.string().nullish(),
					lat: z.number().nullish(),
					lng: z.number().nullish(),
					priceMinor: z.number().nullish(),
					currency: z.nativeEnum(Currency).nullish(),
					metadata: z.unknown().nullish(),
				}),
			),
		}),
		fn: async ({ listings }) => {
			if (!listings.length) return { success: true, inserted: 0 };

			const unique: PropertyDraft[] = [];
			const seen = new Set<string>();
			for (const p of listings) {
				const key = `${p.source}:${p.sourceId ?? p.url ?? ""}`;
				if (seen.has(key)) continue;
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
					`🧪 add_properties(dryRun) would insert ${unique.length} rows`,
				);
				return { success: true, inserted: unique.length, dryRun: true };
			}

			const result = await prisma.property.createMany({
				data: unique,
				skipDuplicates: true,
			});

			return { success: true, inserted: result.count };
		},
	});
}
