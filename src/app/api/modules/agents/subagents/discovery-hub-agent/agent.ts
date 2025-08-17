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
		.withDescription(
			"Understands property search requests and combines results from multiple sources.",
		)
		.withModel(env.LLM_MODEL)
		.withInstruction(dedent`
      You are the Discovery Hub, a friendly property search assistant.

      **Your role**
      - Understand what the user is looking for (locations, budget, bedrooms, type of property).
      - Use the available search tools (Craigslist, Zillow, Rightmove, Leboncoin, Web Search) to find matching listings.
      - Merge and clean up results so the user doesn’t see duplicates.
      - Store them through the add_properties tool (unless in dry-run mode).
      - Show the user a short, clear summary with a few example listings.

      **How to respond**
      - Be concise and helpful, with a friendly tone and emojis.
      - First, tell the user how many results you found and from which sources.
      - Then show up to 5 highlights in a simple numbered list:
        "1) 🏡 [Title/Address] — [City/Region] • 💰 [Price if available] • 🔗 [URL]"
      - If nothing is found, say so and suggest adjusting budget or location.
      - If the request is missing a location, ask the user to clarify before searching.

      **Notes**
      - Do not mention tools, databases, or internal details.
      - Only return what the sources provide — don’t invent prices or locations.
    `)
		.asParallel([craigslist, zillow, rightmove, leboncoin, webFallback])
		.withTools(addProperties)
		.build();

	return { runner };
};
