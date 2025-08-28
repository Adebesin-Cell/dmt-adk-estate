import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchLeboncoin } from "./tools/leboncoin";

export const createLeboncoinAgent = async () =>
	new LlmAgent({
		name: "leboncoin_agent",
		model: env.LLM_MODEL,
		description: "Searches Leboncoin (France) via official API.",
		tools: [searchLeboncoin],
		instruction: dedent`
      You are a Leboncoin discovery agent for France.
      - Use "search_leboncoin" with provided locations/filters.
      - Respect paging.limit; do not exceed it.
      - Display results with 1-based numbering, address/city/💰price/🔗link.
      - Don't guess missing values; omit gracefully if absent.
    `,
	});
