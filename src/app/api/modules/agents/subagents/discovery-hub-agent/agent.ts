import { ParallelAgent } from "@iqai/adk";
import { createCraigslistAgent } from "./craiglist-agent";
import { createLeboncoinAgent } from "./leboncoin-agent";
import { createRightmoveAgent } from "./right-move-agent";
import { createWebFallbackAgent } from "./web-search-agent";
import { createZillowAgent } from "./zillow-agent";

export const createDiscoveryHubAgent = async () => {
	const [craigslist, zillow, rightmove, leboncoin, webFallback] =
		await Promise.all([
			createCraigslistAgent(),
			createZillowAgent(),
			createRightmoveAgent(),
			createLeboncoinAgent(),
			createWebFallbackAgent(),
		]);

	const agent = new ParallelAgent({
		name: "discovery_hub",
		description: `
      The Discovery Hub specializes in **property searches across multiple marketplaces**.
      It takes a user's request (location, budget, bedrooms, property type) and:
      - Queries Craigslist, Zillow, Rightmove, Leboncoin, and Web Search
      - Merges and deduplicates results
      - If no results, it suggests adjusting filters like budget or location

      The agent’s purpose is to give the user a fast, unified view of available properties,
      without exposing source details or technical internals.

			CRITICAL RESPONSE FORMAT:
				Your response must contain both:
				1. User-friendly summary of what was found
				2. Raw listings data in a clearly marked section that the orchestrator can extract

				Example response format:
				"Search completed! Found 45 listings across 3 sources:
				- Craigslist: 12 listings
				- Zillow: 28 listings
				- Rightmove: 5 listings

				=== LISTINGS_DATA_START ===
				[all full listings data from all agents]
				=== LISTINGS_DATA_END ===
				"

				The orchestrator needs to extract the listings data between the markers to persist to database.
    `,
		subAgents: [zillow, craigslist, rightmove, leboncoin, webFallback],
	});

	return agent;
};
