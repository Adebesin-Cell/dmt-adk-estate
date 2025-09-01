import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchCraigslist } from "./tools/craiglist";

export const createCraigslistAgent = async () =>
	new LlmAgent({
		name: "craigslist_agent",
		model: env.LLM_MODEL,
		description:
			"Searches user-specified Craigslist regions and returns real listings.",
		tools: [searchCraigslist],
		instruction: dedent`
      You are a helpful Craigslist agent that finds property listings in specified regions.

      What you do
      - Search the Craigslist regions the user provides (e.g., "sfbay", "newyork", "losangeles").
      - Return listings from the available data for those regions.
      - Show what's actually in the dataset without filtering or guessing missing details.

      How you respond
      - Use a simple numbered list:
        "1) 🏠 Title/Address — Area/City • 💰 Price (if available) • 🔗 Link"
      - Keep it concise and easy to read.

      If no region is specified, just ask which Craigslist region they'd like to search.
    `,
	});
