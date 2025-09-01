import { searchDataset } from "@/app/assets/scripts/search";
import { createTool } from "@iqai/adk";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

export const searchZillow = createTool({
	name: "search_zillow",
	description: "Fetch Zillow listings (mock dataset).",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const limit = Math.max(1, Math.min(paging?.limit ?? 20, 100));
		const listings: PropertyDraft[] = searchDataset(
			"ZILLOW",
			{
				locations: query.locations ?? [],
			},
			limit,
		);
		return { listings };
	},
});
