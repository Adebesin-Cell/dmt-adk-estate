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
