import z from "zod";

const countrySchema = z.object({
	name: z.string(),
	iso2: z.string(),
});

export const countryResponseSchema = z.object({
	error: z.boolean(),
	msg: z.string(),
	data: z.array(countrySchema),
});

export const profileSchema = z.object({
	firstName: z.string().trim().max(50).optional().default(""),
	lastName: z.string().trim().max(50).optional().default(""),
	email: z.string().optional(),
	organization: z
		.string()
		.trim()
		.max(120)
		.optional()
		.or(z.literal(""))
		.transform((v) => (v ? v : undefined)),
});
