import { searchDataset } from "@/app/assets/scripts/search";
import { createTool } from "@iqai/adk";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

export const searchCraigslist = createTool({
	name: "search_craigslist",
	description: "Fetch Craigslist listings (mock dataset).",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const limit = Math.max(1, Math.min(paging?.limit ?? 20, 100));
		const listings: PropertyDraft[] = searchDataset(
			"CRAIGSLIST",
			{
				locations: query.locations ?? [],
			},
			limit,
		);
		return { listings };
	},
});
