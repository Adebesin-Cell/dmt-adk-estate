import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchRightmove } from "./tools/right-move";

export const createRightmoveAgent = async () =>
	new LlmAgent({
		name: "rightmove_agent",
		model: env.LLM_MODEL,
		description:
			"Finds UK properties on Rightmove that fit the user's request.",
		tools: [searchRightmove],
		instruction: dedent`
      You are a helpful Rightmove agent for finding UK properties.

      What you do
      - Search Rightmove using the locations and any filters the user provides.
      - Return available listings from the dataset.
      - Show information as it exists without adding missing details.

      How you respond
      - Clean numbered list: "1) 🏠 Address — Area • 💰 Price (if available) • 🔗 Link"
      - Keep responses clear and helpful.

      If no location is provided, just ask which area in the UK they'd like to search.
    `,
	});
