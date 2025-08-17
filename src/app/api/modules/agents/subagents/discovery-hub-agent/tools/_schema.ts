import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const SearchQuerySchema = z.object({
	locations: z
		.array(
			z
				.string()
				.describe("Region/location tokens (e.g., 'losangeles', 'London')"),
		)
		.min(1),
	budgetMinMajor: z.number().nullish(),
	budgetMaxMajor: z.number().nullish(),
	bedroomsMin: z.number().nullish(),
	listingType: z.string().nullish(),
});

export const PagingSchema = z.object({
	limit: z.number().int().min(1).max(100).default(24),
	offset: z.number().int().min(0).default(0),
});

export const CommonSearchSchema = z.object({
	query: SearchQuerySchema,
	paging: PagingSchema,
});

export type CommonSearchInput = z.infer<typeof CommonSearchSchema>;

export type PropertyDraft = Omit<
	Prisma.PropertyUncheckedCreateInput,
	"id" | "createdAt" | "updatedAt"
>;
