import { env } from "@/env";
import { getAuth } from "@everipedia/iq-login";
import { AgentBuilder } from "@iqai/adk";
import type { Currency, Goal, RiskLevel } from "@prisma/client";
import dedent from "dedent";
import { buildInitialState } from "../build-initial-state";
import { createInvestmentAnalysisAgent } from "./subagents/analyse-investment-agent/agent";
import { createDiscoveryHubAgent } from "./subagents/discovery-hub-agent/agent";

export const createOrchestratorAgent = async () => {
	const { address } = await getAuth();

	if (!address) {
		const { runner } = await AgentBuilder.create(
			"align_orchestrator_login_gate",
		)
			.withModel(env.LLM_MODEL)
			.withDescription("Login gate for Align Orchestrator")
			.withInstruction("Always reply exactly: Please log in to continue.")
			.build();
		return { runner };
	}

	const [
		{ agent: discoveryHubAgent },
		{ agent: investmentAnalysisAgent },
		initialState,
	] = await Promise.all([
		createDiscoveryHubAgent(),
		createInvestmentAnalysisAgent(),
		buildInitialState(address),
	]);

	const prefs = initialState.preferences as {
		budgetMin: number | null;
		budgetMax: number | null;
		currency: Currency;
		risk: RiskLevel;
		locations: string[];
		goals: Goal[];
	};

	const currencySymbol =
		prefs.currency === "USD" ? "$" : prefs.currency === "GBP" ? "£" : "€";

	const locationHint =
		prefs.locations && prefs.locations.length > 0
			? `Your preferred locations: ${prefs.locations.join(", ")}`
			: "No preferred locations set";

	const budgetHint =
		prefs.budgetMin !== null || prefs.budgetMax !== null
			? `Your budget range: ${
					prefs.budgetMin !== null
						? `${currencySymbol}${prefs.budgetMin.toLocaleString()}`
						: "No min"
				} - ${prefs.budgetMax !== null ? `${currencySymbol}${prefs.budgetMax.toLocaleString()}` : "No max"}`
			: "No budget preferences set";

	const riskHint = `Your risk level: ${prefs.risk}`;
	const goalsHint =
		prefs.goals && prefs.goals.length > 0
			? `Your investment goals: ${prefs.goals.join(", ")}`
			: "No investment goals set";

	const contextHints = dedent`
    User context
    - ${locationHint}
    - ${budgetHint}
    - Default currency symbol: ${currencySymbol}
    - ${riskHint}
    - ${goalsHint}
  `;

	const { runner } = await AgentBuilder.create("align_orchestrator")
		.withModel("gpt-4.1-mini")
		.withDescription(
			"Align Orchestrator. Classifies user intent and delegates work to subagents. Uses Discovery Hub for property search/aggregation and Investment Analysis for detailed financial evaluation. May call subagents sequentially or in parallel and combine outputs when helpful.",
		)
		.withInstruction(
			dedent`
        ${contextHints}

        You are the Align Orchestrator.

        Your role
        - Decide whether to call the discovery_hub (property search) or analyse_investment_agent (financial analysis).
        - Never do the work yourself — just route and summarize what happened.
        - Always keep replies short, clear, and user-friendly.

        Response Style
        - Maintain a warm, helpful tone 🙂
        - Provide a quick note about what each agent can do when routing
        - If the request is ambiguous, ask clarifying questions 🤔
        - After delegating, summarize what was accomplished ✅
        - Suggest a related next action 👉
        - Use emojis to make the message friendlier 🎉
        - Answer in plain text only (no markdown), except for short dash lists

        Routing
        - Property search, browse, find listings → discovery_hub
        - Financial evaluation, ROI, rent vs buy, cap rate → analyse_investment_agent
        - Mixed intent (“find then analyze”) → run discovery first, then feed selected results to analysis

        Handling Outputs
        - Do not reformat or invent schema outputs — only return raw JSON/schema if the user explicitly asks
        - By default, only give a friendly summary of what you did and what you found
        - Example: I searched Paris apartments under ${currencySymbol}1,200 and found 25 listings 🏙️. Want me to analyze the best 3?

        Guardrails
        - If no results found, suggest one concrete adjustment (e.g., widen budget or location)
        - If analysis fails for a listing, continue with the others and mention which one failed
      `,
		)
		.withSubAgents([discoveryHubAgent, investmentAnalysisAgent])
		.build();

	return { runner };
};
