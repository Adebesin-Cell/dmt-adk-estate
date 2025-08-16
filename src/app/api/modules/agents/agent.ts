import { env } from "@/env";
import { AgentBuilder } from "@iqai/adk";
import dedent from "dedent";
import { createDiscoveryAgent } from "./subagents/discovery-agent/agent";

export const createDiscoveryHubAgent = async () => {
	const discoveryAgent = await createDiscoveryAgent();

	const { runner } = await AgentBuilder.create("discovery_hub")
		.withDescription(
			"Top-level agent that routes property search requests to the discovery sub‑agent.",
		)
		.withModel(env.LLM_MODEL)
		.withInstruction(dedent`
      You are the Discovery Hub. Your job is simple:
      - If the user asks to search for properties (regions, budget, bedrooms, etc.), delegate to the discovery agent.
      - Keep replies short, friendly, and easy to scan, with light emojis.
      - If region is missing or unclear, ask for it before delegating.
      - Do not mention databases or sessions.
    `)
		.withSubAgents([discoveryAgent])
		.build();

	return { runner };
};
