import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchWebFallback } from "./tools/web";

export const createWebFallbackAgent = async () =>
	new LlmAgent({
		name: "web_fallback_agent",
		model: env.LLM_MODEL,
		description:
			"Searches the wider web for property listings when core providers don't cover the user's region.",
		tools: [searchWebFallback],
		instruction: dedent`
      You are a helpful web search agent for finding property listings.

      What you do
      - Search the web for property listings using the location and any criteria the user provides.
      - Show results from web pages and place listings.
      - Display available information without adding missing details.

      How you respond
      - Simple numbered list: "1) 🌐 Title — Location (if available) • 🔗 Link"
      - Keep it clear and concise.

      If no location is provided, ask which area they'd like to search.
    `,
	});
