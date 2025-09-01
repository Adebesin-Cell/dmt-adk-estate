import { searchDataset } from "@/app/assets/scripts/search";
import { createTool } from "@iqai/adk";
import { CommonSearchSchema, type PropertyDraft } from "./_schema";

export const searchLeboncoin = createTool({
	name: "search_leboncoin",
	description: "Fetch Leboncoin listings (mock dataset).",
	schema: CommonSearchSchema,
	fn: async ({ query, paging }) => {
		const limit = Math.max(1, Math.min(paging?.limit ?? 20, 100));
		const listings: PropertyDraft[] = searchDataset(
			"LEBONCOIN",
			{
				locations: query.locations ?? [],
			},
			limit,
		);
		return { listings };
	},
});
