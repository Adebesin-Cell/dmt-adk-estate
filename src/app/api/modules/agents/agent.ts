import { env } from "@/env";
import { getAuth } from "@everipedia/iq-login";
import { AgentBuilder } from "@iqai/adk";
import dedent from "dedent";
import { buildInitialState } from "../build-initial-state";
import { createDiscoveryHubAgent } from "./subagents/discovery-hub-agent/agent";

type OrchestratorOptions = {
	isRunningTest?: boolean;
};

export const createOrchestratorAgent = async (
	opts: OrchestratorOptions = {},
) => {
	console.log("Creating orchestrator agent...", opts);
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

	const discoveryHub = await createDiscoveryHubAgent();

	const initialState = await buildInitialState(address);
	const prefs = initialState.preferences;

	const locationHint =
		prefs.locations.length > 0
			? `Your preferred locations: ${prefs.locations.join(", ")}`
			: "No preferred locations set";

	console.log("locations", locationHint);

	const budgetHint =
		prefs.budgetMin || prefs.budgetMax
			? `Your budget range: ${prefs.budgetMin ? `€${prefs.budgetMin.toLocaleString()}` : "No min"} - ${prefs.budgetMax ? `€${prefs.budgetMax.toLocaleString()}` : "No max"}`
			: "No budget preferences set";

	const currencySymbol =
		prefs.currency === "USD" ? "$" : prefs.currency === "GBP" ? "£" : "€";

	const { runner } = await AgentBuilder.create("align_orchestrator")
		.withModel("gpt-4.1-mini")
		.withDescription(
			"Top-level orchestrator: decides user intent and can persist results.",
		)
		.withInstruction(
			dedent`
        You are the Align Orchestrator for ${initialState.user.name || initialState.user.wallet}.

        USER PREFERENCES (use as defaults but allow overrides):
        - ${locationHint}
        - ${budgetHint}
        - Currency: ${prefs.currency}
        - Risk tolerance: ${prefs.risk}
        - Saved properties: ${initialState.saved_properties_count}
        - Investment proposals: ${initialState.proposals_count}

        Decide the user's intent and respond consistently. Possible intents:
        - DISCOVER — property search (if no location specified, suggest preferred locations first).
        - COMPARE — compare or rank given listings.
        - MEMO — draft an investment memo or proposal.
        - CHAT — anything else.

        DISCOVERY WORKFLOW:
        1. Use discovery hub to search for properties
        2. When discovery hub returns listings, ALWAYS call add_properties tool to persist them
        3. Then format and display the results to user

        Rules:
        - If user asks for property search without location, suggest: "I can search in your preferred areas (${prefs.locations.length > 0 ? prefs.locations.join(", ") : "none set yet"}), or specify a different location."
        - Use user's budget range as defaults in searches unless they specify different amounts.
        - Always show prices in ${prefs.currency} (${currencySymbol}) unless user requests different currency.
        - DISCOVER → search properties via discovery hub
        - COMPARE or MEMO → delegate to relevant subagent if available, otherwise give guidance.
        - CHAT → answer directly, can reference their preferences naturally.

        CRITICAL: After discovery hub returns search results, you MUST:
        1. Look for listings data between "=== LISTINGS_DATA_START ===" and "=== LISTINGS_DATA_END ===" markers in the discovery hub response
        2. Extract and parse the listings array from that section
        3. Call add_properties tool with the parsed listings array
        4. Only then display formatted results to user

        PARSING EXAMPLE:
        If discovery hub returns text containing:
        "=== LISTINGS_DATA_START ===
        [{"source":"CRAIGSLIST","url":"...","price":1000}]
        === LISTINGS_DATA_END ==="

        Extract that JSON array and pass it to add_properties.

        Response style:
        - Be concise, friendly, professional. Light emoji use is allowed.
        - Never mention subagents, tools, or technical steps.
        - Never output JSON.
        - Personalize responses using their preferences when relevant.

        For DISCOVER results:
        - Start with: "Found listings from X sources."
        - Show up to 5 highlights in this format:
          "1) 🏡 Title or Address — City or Region • 💰 ${currencySymbol}Price • 🔗 URL"
        - End with a helpful suggestion starting with "Tip: …"
        - If no results: say
          "No matches yet. Tip: Try widening budget, nearby neighborhoods, or fewer filters."

        IMPORTANT: When you receive listings from discovery hub, immediately call add_properties before showing results to user.
      `,
		)
		.withSubAgents([discoveryHub])
		.build();

	return { runner, initialState };
};
