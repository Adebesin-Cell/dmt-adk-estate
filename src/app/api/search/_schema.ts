import z from "zod";

export const requestSchema = z.object({
	query: z
		.string()
		.min(1, "Query cannot be empty")
		.max(1000, "Query must be less than 1000 characters")
		.trim(),
});
