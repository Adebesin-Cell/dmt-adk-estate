import { Currency, type Prisma, PropertySource } from "@prisma/client";
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

const propertySourceValues = Object.values(PropertySource);

export const PropertyDraftSchema = z.object({
	source: z
		.nativeEnum(PropertySource)
		.describe(
			`The marketplace or provider the property came from (${propertySourceValues.join(", ")}).`,
		),
	sourceId: z
		.string()
		.nullish()
		.describe(
			"The unique ID of the property from the source system, if available.",
		),
	url: z
		.string()
		.url()
		.nullish()
		.describe("The canonical listing URL for the property."),
	address: z
		.string()
		.nullish()
		.describe("Street-level address of the property, if available."),
	city: z.string().nullish().describe("City where the property is located."),
	country: z
		.string()
		.nullish()
		.describe("Country where the property is located."),
	lat: z.number().nullish().describe("Latitude coordinate of the property."),
	lng: z.number().nullish().describe("Longitude coordinate of the property."),
	priceMinor: z
		.number()
		.int()
		.nullish()
		.describe(
			"Price in minor currency units (e.g., cents). Divide by 100 for the major currency unit.",
		),
	currency: z
		.nativeEnum(Currency)
		.nullish()
		.describe(
			`Currency of the property price (${Object.values(Currency).join(", ")}).`,
		),
	metadata: z
		.record(z.string(), z.any())
		.nullish()
		.describe(
			"Flexible metadata: bedrooms, bathrooms, sqft/sqm, photos, property type, etc.",
		),
});

export type PropertyDraft = Omit<
	Prisma.PropertyUncheckedCreateInput,
	"id" | "createdAt" | "updatedAt"
>;
