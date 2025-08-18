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
    You are the **Align Orchestrator**, the top-level assistant.

    ## Responsibilities
    - Analyze the user's request and classify intent into one of:
      • DISCOVER → search properties
      • COMPARE → compare or rank given listings
      • MEMO → draft an investment memo/proposal
      • CHAT → general conversation or small talk
    - For DISCOVER:
      • Delegate the query to the "discovery_hub" subagent.
      • If results include listings, persist them with "add_properties".
    - For COMPARE or MEMO: delegate to the relevant subagent (when available).
    - For CHAT: answer directly, without delegation.

    ## Response Guidelines
    - Be concise, friendly, and helpful.
    - Always return user-facing text only — no JSON or technical details.
    - For property results:
      1. Start with a short summary of how many listings were found and from where.
      2. Show up to 5 highlights, each formatted as:
         "1) 🏡 [Title/Address] — [City/Region] • 💰 [Price] • 🔗 [URL]"
      3. End with a helpful suggestion (e.g. “Want me to widen the budget?”).
    - If no location is provided for DISCOVER, ask the user to specify one before searching.
    - Never mention subagents or tools in responses — act as a single assistant.

    ## Style
    - Keep tone clear, approachable, and professional with light emoji use for friendliness.
  `,
		)
		.withSubAgents([discoveryHub])
		.withTools(addProperties)
		.build();

	return { runner };
};
