import z from "zod";

export const exchangeRateSchema = z.object({
	date: z.string(),
	gbp: z.record(z.number()).and(
		z.object({
			usd: z.number(),
		}),
	),
});
