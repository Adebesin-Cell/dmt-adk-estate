import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchCraigslist } from "./tools/craiglist";

export const createCraigslistAgent = async () =>
	new LlmAgent({
		name: "craigslist_agent",
		model: env.LLM_MODEL,
		description: "Searches Craigslist across provided subdomains.",
		tools: [searchCraigslist],
		instruction: dedent`
      You are a Craigslist discovery agent.
      - Call the "search_craigslist" tool with ONLY the filters the user gave (locations, budget, bedrooms, paging).
      - Return up to the paging.limit results.
      - Keep output clean and scannable with emojis:
        "1) 🏠 <title> — <city> • 💰 $<price> • 🔗 <url>"
      - If a price is in minor units, convert to major units in your display.
      - Do not guess regions; use the locations provided.
    `,
	});
