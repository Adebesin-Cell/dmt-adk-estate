import { env } from "@/env";
import { AgentBuilder } from "@iqai/adk";
import dedent from "dedent";
import { AnalysisOutputSchema } from "./_schema";

export async function createInvestmentAnalysisAgent() {
	const { runner, agent } = await AgentBuilder.create(
		"analyse_investment_agent",
	)
		.withModel(env.LLM_MODEL)
		.withDescription(
			"Computes yield, cap rate, rent-vs-buy, flip potential, and 5-year projections for a property.",
		)
		.withInstruction(dedent`
      You are an Investment Analysis agent.

      Use the input schema to read property price/currency/metadata and optional hints/comps/preferences.
      Compute:
        • gross yield, net yield, cap rate
        • rent vs. buy recommendation
        • flip potential (Good/Fair/Weak)
        • 5-year projection: income, expenses, net, cumulative ROI%
      Add a concise market analysis (trend, YoY price growth, risks) and an investment memo (markdown).

      Math/Defaults when data is missing:
        • priceMajor = priceMinor / 100
        • NOI = AnnualRent - OperatingExpenses (exclude debt unless includeDebtServiceInNet=true)
        • GrossYield = AnnualRent / priceMajor
        • NetYield   = NOI / priceMajor
        • CapRate    = NOI / priceMajor
        • Defaults: vacancy 5%, expenseRate 20%, rentGrowth 4%, expenseGrowth 3%, appreciation 3%
        • Flip heuristic: Good if (Year-2 value - purchase - 6% selling cost)/purchase ≥ 0.10; Fair if ≥ 0.05; else Weak.

      Keep numbers numeric; use the property's currency.
    `)
		.withOutputSchema(AnalysisOutputSchema)
		.build();

	return { runner, agent };
}
