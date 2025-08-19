import type { Currency } from "@prisma/client";
import { z } from "zod";

export const CurrencyEnum = z
	.enum(["EUR", "USD", "GBP"])
	.describe(
		"ISO currency code for all monetary values in *major* units (e.g., 298000 means €298,000 when paired with EUR).",
	) as unknown as z.ZodType<Currency>;

export const PropertyInputSchema = z
	.object({
		id: z.string().describe("Internal Property.id (cuid)."),
		address: z
			.string()
			.nullable()
			.optional()
			.describe("Street address (nullable if missing)."),
		city: z
			.string()
			.nullable()
			.optional()
			.describe("City name (nullable if missing)."),
		country: z
			.string()
			.nullable()
			.optional()
			.describe("Country name (nullable if missing)."),
		url: z
			.string()
			.url()
			.nullable()
			.optional()
			.describe("Public listing URL (nullable)."),
		priceMinor: z
			.number()
			.int()
			.nonnegative()
			.nullish()
			.describe(
				"Purchase price in *minor* units (e.g., cents). Convert to major by dividing by 100.",
			),
		currency: CurrencyEnum.nullish().describe(
			"Currency for priceMinor; projections/metrics reported in this currency.",
		),
		metadata: z
			.unknown()
			.nullable()
			.optional()
			.describe(
				"Flexible listing metadata (e.g., bedrooms, bathrooms, sqm, images).",
			),
	})
	.describe("Property inputs required for ROI/cap rate computation.");

export const RentCompSchema = z
	.object({
		monthlyRent: z
			.number()
			.positive()
			.describe(
				"Monthly rent in *major* units of the property's currency (e.g., 1800 = €1,800/month).",
			),
		distanceKm: z
			.number()
			.nonnegative()
			.optional()
			.describe("Distance from subject property in kilometers."),
		bedrooms: z
			.number()
			.int()
			.positive()
			.optional()
			.describe("Number of bedrooms in the comp."),
		bathrooms: z
			.number()
			.int()
			.positive()
			.optional()
			.describe("Number of bathrooms in the comp."),
		sqm: z
			.number()
			.positive()
			.optional()
			.describe("Interior size in square meters."),
		notes: z.string().optional().describe("Free-form notes about the comp."),
	})
	.describe("Single rental comp used to derive rent assumptions.");

export const UserPreferencesSchema = z
	.object({
		targetYieldPct: z
			.number()
			.positive()
			.optional()
			.describe("User's target net yield percentage (e.g., 8 = 8%)."),
		risk: z
			.enum(["LOW", "MODERATE", "HIGH"])
			.optional()
			.describe("User risk tolerance."),
		goal: z
			.enum(["CASHFLOW", "APPRECIATION", "FLIP", "CO_OWNERSHIP"])
			.optional()
			.describe("Primary investment goal to tilt analysis/memo."),
	})
	.optional()
	.describe("Optional user preference hints.");

export const HintsSchema = z
	.object({
		rentAnnual: z
			.number()
			.positive()
			.optional()
			.describe(
				"Override for annual gross rent in *major* units (e.g., 48000 = €48,000/year).",
			),
		vacancyRatePct: z
			.number()
			.min(0)
			.max(50)
			.optional()
			.default(5)
			.describe(
				"Vacancy allowance as a percentage of potential rent (default 5).",
			),
		expenseRatePct: z
			.number()
			.min(0)
			.max(100)
			.optional()
			.default(20)
			.describe(
				"Operating expense rate as % of effective gross income (default 20).",
			),
		rentGrowthPct: z
			.number()
			.min(-50)
			.max(100)
			.optional()
			.default(4)
			.describe("Annual rent growth assumption in percent (default 4)."),
		expenseGrowthPct: z
			.number()
			.min(-50)
			.max(100)
			.optional()
			.default(3)
			.describe("Annual operating expense growth in percent (default 3)."),
		appreciationPct: z
			.number()
			.min(-50)
			.max(100)
			.optional()
			.default(3)
			.describe("Annual property value appreciation in percent (default 3)."),
		financing: z
			.object({
				ltvPct: z
					.number()
					.min(0)
					.max(100)
					.optional()
					.describe("Loan-to-Value percentage if financing is used."),
				ratePct: z
					.number()
					.min(0)
					.max(100)
					.optional()
					.describe("Annual interest rate percentage."),
				termYears: z
					.number()
					.int()
					.positive()
					.optional()
					.describe("Amortization term in years."),
				downPaymentPct: z
					.number()
					.min(0)
					.max(100)
					.optional()
					.describe("Down payment as % of purchase price."),
				closingCostsPct: z
					.number()
					.min(0)
					.max(100)
					.optional()
					.describe("Closing/transaction costs as % of price."),
				includeDebtServiceInNet: z
					.boolean()
					.optional()
					.describe(
						"If true, 'net' in projections includes debt service (cashflow). If false/omitted, 'net' equals NOI (pre-debt).",
					),
			})
			.optional()
			.describe("Optional financing terms to compute levered cashflows."),
	})
	.optional()
	.describe("Optional overrides for assumptions and financing.");

export const AnalysisInputSchema = z
	.object({
		property: PropertyInputSchema.describe("Subject property being evaluated."),
		comps: z
			.array(RentCompSchema)
			.optional()
			.describe("Optional rental comps for rent estimation."),
		userPreferences: UserPreferencesSchema.optional(),
		hints: HintsSchema.optional(),
	})
	.describe(
		"Input payload for investment analysis. All monetary amounts are in the property's currency. priceMinor is the only minor-unit field.",
	);

export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;

export const AnalysisProjectionYearSchema = z.object({
	year: z
		.number()
		.int()
		.min(1)
		.max(5)
		.describe("Projection year number (1..5)."),
	income: z
		.number()
		.describe("Annual effective income (after vacancy) in major units."),
	expenses: z.number().describe("Annual operating expenses in major units."),
	net: z
		.number()
		.describe(
			"Annual net. If 'includeDebtServiceInNet' is true, this is cashflow after debt; otherwise NOI (pre-debt).",
		),
	roiPct: z
		.number()
		.describe(
			"Cumulative ROI percentage by end of the given year (e.g., 14.2 = 14.2%).",
		),
});

const FinancingSchema = z.object({
	ltvPct: z
		.number()
		.min(0)
		.max(100)
		.default(70)
		.describe("Loan-to-Value percentage."),
	ratePct: z
		.number()
		.min(0)
		.max(100)
		.default(6)
		.describe("Annual interest rate percentage."),
	termYears: z
		.number()
		.int()
		.positive()
		.default(30)
		.describe("Amortization term in years."),
	downPaymentPct: z
		.number()
		.min(0)
		.max(100)
		.default(30)
		.describe("Down payment as percentage of price."),
	closingCostsPct: z
		.number()
		.min(0)
		.max(100)
		.default(2)
		.describe("Closing costs as percentage of price."),
	includeDebtServiceInNet: z
		.boolean()
		.default(false)
		.describe("If true, projections 'net' includes debt service (cashflow)."),
});

/** Non-null assumptions with defaults */
const AssumptionsSchema = z.object({
	rentAnnual: z
		.number()
		.describe("Annual gross rent in major units used for calculations."),
	vacancyRatePct: z
		.number()
		.default(5)
		.describe("Vacancy allowance percentage (default 5)."),
	expenseRatePct: z
		.number()
		.default(20)
		.describe("Operating expenses as % of effective gross income."),
	rentGrowthPct: z
		.number()
		.default(4)
		.describe("Assumed annual rent growth percentage."),
	expenseGrowthPct: z
		.number()
		.default(3)
		.describe("Assumed annual expense growth percentage."),
	appreciationPct: z
		.number()
		.default(3)
		.describe("Assumed annual property value appreciation percentage."),
	financing: FinancingSchema.describe(
		"Financing assumptions used to compute levered cashflows.",
	),
});

const MarketRiskSchema = z.object({
	market: z
		.enum(["Low", "Medium", "High"])
		.describe("Macro/market cycle risk."),
	location: z
		.enum(["Very Low", "Low", "Medium", "High"])
		.describe("Neighborhood/location-specific risk."),
	regulatory: z
		.enum(["Low", "Medium", "High"])
		.describe("Regulatory/tenant-law risk."),
	liquidity: z
		.enum(["Low", "Medium", "High"])
		.describe("Ease of selling/refinancing."),
});

const MarketAnalysisSchema = z.object({
	trend: z
		.enum(["Strong Growth", "Stable", "Declining"])
		.describe("Market trend."),
	priceGrowthYoYPct: z
		.number()
		.describe("YoY price growth percentage for the market."),
	risk: MarketRiskSchema.describe("Risk breakdown."),
});

const MetricsSchema = z.object({
	purchasePrice: z.number().describe("Purchase price in major units."),
	currency: CurrencyEnum.describe("Currency used for all monetary outputs."),
	grossYieldPct: z
		.number()
		.describe("Gross yield = Annual Rent / Purchase Price * 100."),
	netYieldPct: z
		.number()
		.describe(
			"Net yield = (Annual Rent - Operating Expenses) / Purchase Price * 100 (pre-debt).",
		),
	capRatePct: z
		.number()
		.describe("Cap rate = NOI / Purchase Price * 100 (pre-debt)."),
	roiPct: z
		.number()
		.describe(
			"Headline cumulative ROI percentage at Year 5 from the projection (e.g., 42.7 = 42.7%).",
		),
	rentVsBuy: z
		.enum(["RENT", "BUY", "NEUTRAL"])
		.describe("Rent vs buy recommendation."),
	flipPotential: z
		.enum(["Good", "Fair", "Weak"])
		.describe("Flip attractiveness."),
});

/** Data source metadata and warnings must always be present */
const DataSourceSchema = z.object({
	priceSource: z.string().describe("Where price data came from."),
	rentSource: z.string().describe("How rent was estimated."),
	hasComps: z.boolean().describe("Whether rental comps were provided."),
});

/** FINAL: Non-null, defaulted, schema-safe analysis output */
export const AnalysisOutputSchema = z
	.object({
		version: z.string().default("1.0").describe("Schema/version marker."),
		metrics: MetricsSchema.describe("Headline investment metrics."),
		assumptions: AssumptionsSchema.describe("Assumptions used."),
		projection5y: z
			.array(AnalysisProjectionYearSchema)
			.length(5)
			.describe(
				"Exactly five annual rows with income, expenses, net, and cumulative ROI%.",
			),
		marketAnalysis: MarketAnalysisSchema.describe(
			"Market context and risk assessment.",
		),
		highlights: z
			.array(z.string())
			.min(0)
			.max(8)
			.describe(
				"0–8 bullet tags for UI chips (e.g., 'High Yield', 'City Center').",
			),
		memoMarkdown: z
			.string()
			.min(1)
			.describe("Comprehensive investment memo in Markdown."),
		status: z
			.enum(["SUCCESS", "PARTIAL", "ERROR"])
			.default("SUCCESS")
			.describe("Analysis completion status."),
		warnings: z
			.array(z.string())
			.default([])
			.describe("Notes on missing data/assumptions."),
		dataSource: DataSourceSchema.describe("Metadata about data sources used."),
	})
	.describe(
		"Strict structured output of the investment analysis. All fields are required and non-null. All money values are in the property's currency.",
	);

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
