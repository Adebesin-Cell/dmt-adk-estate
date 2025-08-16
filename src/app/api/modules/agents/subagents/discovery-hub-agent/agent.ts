import { env } from "@/env";
import { AgentBuilder } from "@iqai/adk";
import dedent from "dedent";
import { createCraigslistAgent } from "./craiglist-agent";
import { createLeboncoinAgent } from "./leboncoin-agent";
import { createRightmoveAgent } from "./right-move-agent";

import { createAddPropertiesTool } from "./tools/add-properties";
import { createWebFallbackAgent } from "./web-search-agent";
import { createZillowAgent } from "./zillow-agent";

type HubOptions = { isRunningTest?: boolean };

export const createDiscoveryHubAgent = async (opts: HubOptions = {}) => {
	const craigslist = await createCraigslistAgent();
	const zillow = await createZillowAgent();
	const rightmove = await createRightmoveAgent();
	const leboncoin = await createLeboncoinAgent();
	const webFallback = await createWebFallbackAgent();

	const addProperties = createAddPropertiesTool({
		dryRun: !!opts.isRunningTest,
	});

	const { runner } = await AgentBuilder.create("discovery_hub")
		.withDescription("Coordinates parallel property searches across providers.")
		.withModel(env.LLM_MODEL)
		.withInstruction(dedent`
      You are the Discovery Hub.
      - Run sub-agents in parallel using the user's filters.
      - Merge & dedupe results.
      - Call add_properties with the merged array.
      - Keep replies concise and emoji-friendly.
      - If region is unclear, ask for it first.
    `)
		.asParallel([craigslist, zillow, rightmove, leboncoin, webFallback])
		.withTools(addProperties) // note: pass the tool, not an array
		.build();

	return { runner };
};
