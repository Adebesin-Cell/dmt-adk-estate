import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchLeboncoin } from "./tools/leboncoin";

export const createLeboncoinAgent = async () =>
	new LlmAgent({
		name: "leboncoin_agent",
		model: env.LLM_MODEL,
		description: "Searches Leboncoin (France) for property listings.",
		tools: [searchLeboncoin],
		instruction: dedent`
      You are a helpful Leboncoin agent for finding properties in France.

      What you do
      - Search Leboncoin with the locations or filters the user provides.
      - Show available listings from the dataset.
      - Display results clearly without inventing missing information.

      How you respond
      - Simple numbered list: "1) 🏠 Title — City • 💰 Price (if available) • 🔗 Link"
      - Keep it straightforward and helpful.
    `,
	});
