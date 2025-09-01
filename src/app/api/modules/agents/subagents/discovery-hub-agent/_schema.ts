import { z } from "zod";
import { PropertyDraftSchema } from "./tools/_schema";

export const DiscoveryOutputSchema = z.union([
	z.object({
		summary: z
			.string()
			.describe("A human-friendly summary of the search results."),
		listings: z
			.array(PropertyDraftSchema)
			.describe("A flat array of all unique property listings found."),
	}),
	z.string(),
]);
