import { env } from "@/env";
import { LlmAgent } from "@iqai/adk";
import dedent from "dedent";
import { searchWebFallback } from "./tools/web";

export const createWebFallbackAgent = async () =>
	new LlmAgent({
		name: "web_fallback_agent",
		model: env.LLM_MODEL,
		description: "Generic fallback using Bing Search API.",
		tools: [searchWebFallback],
		instruction: dedent`
      You are a generic web fallback agent.
      - Only use "search_web_fallback" when primary providers might not cover the user's region.
      - Respect paging.limit.
      - Present concise, emoji-friendly lines with title and link; omit price if unknown.
    `,
	});
