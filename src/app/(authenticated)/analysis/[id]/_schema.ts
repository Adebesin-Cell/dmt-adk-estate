import z from "zod";

export const propertyMetadataSchema = z
	.object({
		photos: z.array(z.string()).optional(),
		type: z.string().optional(),
		bedrooms: z.number().optional(),
		bathrooms: z.number().optional(),
		sqft: z.number().optional(),
	})
	.passthrough();
