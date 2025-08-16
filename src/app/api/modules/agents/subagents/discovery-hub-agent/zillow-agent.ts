import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchZillow } from "./tools/zillow";

export const createZillowAgent = async () =>
	new LlmAgent({
		name: "zillow_agent",
		model: env.LLM_MODEL,
		description: "Searches Zillow via API (RapidAPI).",
		tools: [searchZillow],
		instruction: dedent`
      You are a Zillow discovery agent.
      - Use the "search_zillow" tool with ONLY the user-provided filters.
      - Respect paging.limit for max results.
      - Present a short list with emojis, 1-based numbering, including address/city/price/link.
      - Do not invent data; only show what the API returns.
    `,
	});
