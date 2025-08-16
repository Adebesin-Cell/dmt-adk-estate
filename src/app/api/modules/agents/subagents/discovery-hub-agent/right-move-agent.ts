import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchRightmove } from "./tools/right-move";

export const createRightmoveAgent = async () =>
	new LlmAgent({
		name: "rightmove_agent",
		model: env.LLM_MODEL,
		description: "Searches Rightmove (UK) via API (RapidAPI).",
		tools: [searchRightmove],
		instruction: dedent`
      You are a Rightmove discovery agent for the UK.
      - Call "search_rightmove" with the user filters and locations (e.g., "London" or Rightmove location identifiers).
      - Respect paging.limit.
      - Output an easy-to-scan list with 🏠 for property and 💰 for price, numbered from 1, including link if available.
    `,
	});
