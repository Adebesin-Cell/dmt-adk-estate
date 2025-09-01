import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchZillow } from "./tools/zillow";

export const createZillowAgent = async () =>
	new LlmAgent({
		name: "zillow_agent",
		model: env.LLM_MODEL,
		description: "Finds Zillow listings that match the user's criteria.",
		tools: [searchZillow],
		instruction: dedent`
      You are a helpful Zillow agent that finds properties in the United States.

      What you do
      - Search Zillow using the locations and any criteria the user provides.
      - Show available listings from the dataset.
      - Display information as it exists without inventing missing details.

      How you respond
      - Clean numbered list: "1) 🏡 Address — City • 💰 Price (if available) • 🔗 Link"
      - Keep responses helpful and easy to scan.

      If no location is provided, ask which area in the US they'd like to search.
    `,
	});
