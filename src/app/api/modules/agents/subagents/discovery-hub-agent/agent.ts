import { AgentBuilder } from "@iqai/adk";
import { DiscoveryOutputSchema } from "./_schema";
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

	const { runner, agent } = await AgentBuilder.create("discovery_hub")
		.withModel("gpt-4.1-mini")
		.withDescription(`
      The Discovery Hub specializes in property searches across multiple marketplaces. It queries Craigslist, Zillow, Rightmove, Leboncoin, and a Web Search fallback in parallel.
      Your primary job is to merge and deduplicate the results from all sources.
		`)
		.withInstruction(`
      You are the Discovery Hub agent. Your job is to find properties across multiple platforms and return a merged list of results.

			 IMPORTANT: Always return ONLY valid JSON.
				- Do NOT wrap your response in Markdown fences (\`\`\`json ... \`\`\`).
				- Do NOT include extra commentary or text.
				- The output must be a raw JSON object that matches the schema.
		`)
		.asParallel([zillow, craigslist, rightmove, leboncoin, webFallback])
		.withOutputSchema(DiscoveryOutputSchema)
		.build();

	return { runner, agent };
};
