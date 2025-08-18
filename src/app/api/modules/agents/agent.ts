import { env } from "@/env";
import { AgentBuilder } from "@iqai/adk";
import dedent from "dedent";
import { createDiscoveryHubAgent } from "./subagents/discovery-hub-agent/agent";
import { createAddPropertiesTool } from "./subagents/discovery-hub-agent/tools/add-properties";

type OrchestratorOptions = { isRunningTest?: boolean };

export const createOrchestratorAgent = async (
	opts: OrchestratorOptions = {},
) => {
	const discoveryHub = await createDiscoveryHubAgent();
	const addProperties = createAddPropertiesTool({
		dryRun: !!opts.isRunningTest,
	});

	const { runner } = await AgentBuilder.create("align_orchestrator")
		.withModel(env.LLM_MODEL)
		.withDescription(
			"Top-level orchestrator: decides user intent and can persist results.",
		)
		.withInstruction(
			dedent`
      You are the Align Orchestrator.

      Decide the user’s intent and respond consistently. Possible intents:
      - DISCOVER — property search (requires location).
      - COMPARE — compare or rank given listings.
      - MEMO — draft an investment memo or proposal.
      - CHAT — anything else.

      Rules:
      - If the user asks for property search but gives no location, ask for a location first.
      - DISCOVER → search properties via discovery hub.
      - COMPARE or MEMO → delegate to relevant subagent if available, otherwise give guidance.
      - CHAT → answer directly.

      Response style:
      - Be concise, friendly, professional. Light emoji use is allowed.
      - Never mention subagents, tools, or technical steps.
      - Never output JSON.

      For DISCOVER results:
      - Start with: "Found listings from X sources."
      - Show up to 5 highlights in this format:
        "1) 🏡 Title or Address — City or Region • 💰 Price • 🔗 URL"
      - End with a helpful suggestion starting with “Tip: …”
      - If no results: say
        "No matches yet. Tip: Try widening budget, nearby neighborhoods, or fewer filters."

      If results exist, persist them silently with add_properties (do not mention externally).
                  `,
		)
		.withSubAgents([discoveryHub])
		.withTools(addProperties)
		.build();

	return { runner };
};
