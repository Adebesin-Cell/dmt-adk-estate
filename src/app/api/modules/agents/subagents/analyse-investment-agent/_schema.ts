import type { Currency } from "@prisma/client";
import { z } from "zod";

export const CurrencyEnum = z
	.enum(["EUR", "USD", "GBP"])
	.describe(
		"ISO currency code. All monetary values are in major units (e.g., 298000 means €298,000 when paired with EUR).",
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
				"Purchase price in minor units (cents/pence). MUST be converted to major units by dividing by 100 for all calculations and outputs.",
			),
		currency: CurrencyEnum.nullish().describe(
			"Currency for all monetary values in this analysis.",
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
				"Monthly rent in major currency units (e.g., 1800 means €1,800/month).",
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
			.max(100)
			.optional()
			.describe("User's target net yield percentage (e.g., 8 means 8%)."),
		risk: z
			.enum(["LOW", "MODERATE", "HIGH"])
			.optional()
			.describe("User risk tolerance level."),
		goal: z
			.enum(["CASHFLOW", "APPRECIATION", "FLIP", "CO_OWNERSHIP"])
			.optional()
			.describe("Primary investment goal to customize analysis."),
	})
	.optional()
	.describe("Optional user preferences to customize analysis.");

export const HintsSchema = z
	.object({
		rentAnnual: z
			.number()
			.positive()
			.optional()
			.describe(
				"Override for annual gross rent in major currency units (e.g., 48000 means €48,000/year).",
			),
		vacancyRatePct: z
			.number()
			.min(0)
			.max(50)
			.optional()
			.default(5)
			.describe(
				"Vacancy allowance as percentage of potential rent (default: 5%).",
			),
		expenseRatePct: z
			.number()
			.min(0)
			.max(100)
			.optional()
			.default(20)
			.describe(
				"Operating expenses as percentage of effective gross income (default: 20%).",
			),
		rentGrowthPct: z
			.number()
			.min(-10)
			.max(50)
			.optional()
			.default(4)
			.describe("Annual rent growth assumption percentage (default: 4%)"),
		expenseGrowthPct: z
			.number()
			.min(-10)
			.max(50)
			.optional()
			.default(3)
			.describe("Annual operating expense growth percentage (default: 3%)."),
		appreciationPct: z
			.number()
			.min(-10)
			.max(50)
			.optional()
			.default(3)
			.describe("Annual property value appreciation percentage (default: 3%)."),
		financing: z
			.object({
				ltvPct: z
					.number()
					.min(0)
					.max(95)
					.optional()
					.describe("Loan-to-Value percentage (0-95%)."),
				ratePct: z
					.number()
					.min(0)
					.max(20)
					.optional()
					.describe("Annual interest rate percentage (0-20%)."),
				termYears: z
					.number()
					.int()
					.min(1)
					.max(50)
					.optional()
					.describe("Loan amortization term in years (1-50)."),
				downPaymentPct: z
					.number()
					.min(5)
					.max(100)
					.optional()
					.describe("Down payment as percentage of purchase price (5-100%)."),
				closingCostsPct: z
					.number()
					.min(0)
					.max(15)
					.optional()
					.describe(
						"Closing/transaction costs as percentage of price (0-15%).",
					),
				includeDebtServiceInNet: z
					.boolean()
					.optional()
					.default(false)
					.describe(
						"If true: 'net' values include debt service (post-debt cashflow). If false: 'net' equals NOI (pre-debt).",
					),
			})
			.optional()
			.describe("Optional financing terms for leveraged analysis."),
	})
	.optional()
	.describe("Optional overrides for assumptions and financing parameters.");

export const AnalysisInputSchema = z
	.object({
		property: PropertyInputSchema.describe("Subject property being evaluated."),
		comps: z
			.array(RentCompSchema)
			.optional()
			.describe("Optional rental comparables for rent estimation."),
		userPreferences: UserPreferencesSchema,
		hints: HintsSchema,
	})
	.describe(
		"Complete input for investment analysis. All monetary amounts (except priceMinor) are in major currency units.",
	);

export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;

export const AnalysisProjectionYearSchema = z.object({
	year: z
		.number()
		.int()
		.min(1)
		.max(5)
		.describe("Projection year (1, 2, 3, 4, or 5)."),
	grossIncome: z
		.number()
		.nonnegative()
		.describe("Annual gross rental income in major currency units."),
	effectiveIncome: z
		.number()
		.nonnegative()
		.describe(
			"Annual effective income after vacancy allowance in major currency units.",
		),
	operatingExpenses: z
		.number()
		.nonnegative()
		.describe("Annual operating expenses in major currency units."),
	noi: z
		.number()
		.describe(
			"Net Operating Income (effectiveIncome - operatingExpenses) in major currency units.",
		),
	debtService: z
		.number()
		.nonnegative()
		.optional()
		.describe(
			"Annual debt service (mortgage payments) in major currency units. Only present if financing is used.",
		),
	netCashFlow: z
		.number()
		.describe(
			"Final net cash flow (NOI minus debt service if applicable) in major currency units.",
		),
	propertyValue: z
		.number()
		.positive()
		.describe(
			"Estimated property value at end of year in major currency units.",
		),
	cumulativeROIPct: z
		.number()
		.describe(
			"Cumulative return on investment percentage from start through end of this year (e.g., 14.2 means 14.2%).",
		),
});

const FinancingDetailsSchema = z.object({
	ltvPct: z.number().min(0).max(95).describe("Loan-to-Value percentage used."),
	ratePct: z
		.number()
		.min(0)
		.max(20)
		.describe("Annual interest rate percentage used."),
	termYears: z
		.number()
		.int()
		.min(1)
		.max(50)
		.describe("Loan amortization term in years."),
	loanAmount: z
		.number()
		.nonnegative()
		.describe("Total loan amount in major currency units."),
	downPayment: z
		.number()
		.nonnegative()
		.describe("Down payment amount in major currency units."),
	closingCosts: z
		.number()
		.nonnegative()
		.describe("Closing costs amount in major currency units."),
	monthlyPayment: z
		.number()
		.nonnegative()
		.describe("Monthly mortgage payment in major currency units."),
	annualDebtService: z
		.number()
		.nonnegative()
		.describe("Annual debt service in major currency units."),
	totalCashInvested: z
		.number()
		.positive()
		.describe(
			"Total initial cash investment (downPayment + closingCosts) in major currency units.",
		),
	includeDebtServiceInNet: z
		.boolean()
		.describe("Whether projections include debt service in net calculations."),
});

const AssumptionsUsedSchema = z.object({
	purchasePrice: z
		.number()
		.positive()
		.describe("Purchase price used in calculations (major currency units)."),
	annualGrossRent: z
		.number()
		.positive()
		.describe("Annual gross rent used in calculations (major currency units)."),
	vacancyRatePct: z
		.number()
		.min(0)
		.max(50)
		.describe("Vacancy rate percentage applied."),
	expenseRatePct: z
		.number()
		.min(0)
		.max(100)
		.describe("Operating expense rate percentage applied."),
	rentGrowthPct: z
		.number()
		.min(-10)
		.max(50)
		.describe("Annual rent growth percentage applied."),
	expenseGrowthPct: z
		.number()
		.min(-10)
		.max(50)
		.describe("Annual expense growth percentage applied."),
	appreciationPct: z
		.number()
		.min(-10)
		.max(50)
		.describe("Annual property appreciation percentage applied."),
	financing: FinancingDetailsSchema.optional().describe(
		"Financing details if loan was modeled.",
	),
});

const MarketRiskAssessmentSchema = z.object({
	market: z
		.enum(["Low", "Medium", "High"])
		.describe("Overall market/economic cycle risk level."),
	location: z
		.enum(["Very Low", "Low", "Medium", "High"])
		.describe("Neighborhood/location-specific risk level."),
	regulatory: z
		.enum(["Low", "Medium", "High"])
		.describe("Regulatory and tenant law risk level."),
	liquidity: z
		.enum(["Low", "Medium", "High"])
		.describe("Property liquidity/marketability risk level."),
});

const MarketAnalysisSchema = z.object({
	trend: z
		.enum(["Strong Growth", "Stable", "Declining"])
		.describe("Overall market trend assessment."),
	priceGrowthYoYPct: z
		.number()
		.describe("Year-over-year price growth percentage for local market."),
	demandSupplyBalance: z
		.enum(["High Demand", "Balanced", "Oversupplied"])
		.describe("Local rental demand vs supply balance."),
	risk: MarketRiskAssessmentSchema.describe(
		"Detailed risk breakdown by category.",
	),
});

const InvestmentMetricsSchema = z.object({
	purchasePrice: z
		.number()
		.positive()
		.describe("Property purchase price in major currency units."),
	currency: CurrencyEnum.describe(
		"Currency for all monetary values in this analysis.",
	),
	grossYieldPct: z
		.number()
		.nonnegative()
		.describe("Gross rental yield: (Annual Rent ÷ Purchase Price) × 100."),
	netYieldPct: z
		.number()
		.describe(
			"Net rental yield: ((Annual Rent - Operating Expenses) ÷ Purchase Price) × 100.",
		),
	capRatePct: z
		.number()
		.describe("Capitalization rate: (NOI ÷ Purchase Price) × 100."),
	cashOnCashReturnPct: z
		.number()
		.optional()
		.describe(
			"Cash-on-cash return if financed: (Annual Cash Flow ÷ Cash Invested) × 100.",
		),
	totalROI5YearPct: z
		.number()
		.describe(
			"Total cumulative ROI after 5 years including appreciation and cash flows.",
		),
	monthlyNetCashFlow: z
		.number()
		.describe("Average monthly net cash flow in major currency units."),
	rentVsBuyRecommendation: z
		.enum(["RENT", "BUY", "NEUTRAL"])
		.describe("Rent vs buy recommendation based on analysis."),
	flipPotential: z
		.enum(["Excellent", "Good", "Fair", "Poor"])
		.describe("Short-term flip potential assessment."),
});

const DataSourceInfoSchema = z.object({
	priceSource: z
		.string()
		.min(1)
		.describe("Source or method used to determine purchase price."),
	rentSource: z
		.string()
		.min(1)
		.describe("Source or method used to estimate rental income."),
	compsProvided: z
		.boolean()
		.describe("Whether rental comparables were provided in input."),
	estimationQuality: z
		.enum(["High", "Medium", "Low"])
		.describe("Overall quality/confidence of estimates used."),
});

export const AnalysisOutputSchema = z
	.object({
		version: z
			.string()
			.default("2.0")
			.describe("Schema version for compatibility tracking."),

		metrics: InvestmentMetricsSchema.describe(
			"Core investment performance metrics and recommendations.",
		),

		assumptions: AssumptionsUsedSchema.describe(
			"All assumptions and inputs used in calculations with actual values applied.",
		),

		projections5Year: z
			.array(AnalysisProjectionYearSchema)
			.length(5)
			.describe(
				"Exactly 5 annual projections (years 1-5) with detailed financial breakdown.",
			),

		marketAnalysis: MarketAnalysisSchema.describe(
			"Market context, trends, and risk assessment for investment decision.",
		),

		highlights: z
			.array(z.string().min(1))
			.min(3)
			.max(8)
			.describe(
				"3-8 key investment highlights as short phrases (e.g., 'High Yield', 'Prime Location', 'Cash Flow Positive').",
			),

		investmentMemo: z
			.string()
			.min(500)
			.describe(
				"Comprehensive investment analysis memo in Markdown format. Must include: Executive Summary, Property Analysis, Financial Performance, Market Context, Risk Assessment, Investment Strategy, and Conclusion.",
			),

		analysisStatus: z
			.enum(["SUCCESS", "PARTIAL", "WARNING"])
			.default("SUCCESS")
			.describe(
				"SUCCESS: Complete analysis with good data. PARTIAL: Analysis completed with significant estimates. WARNING: Major data limitations.",
			),

		warnings: z
			.array(z.string())
			.default([])
			.describe(
				"List of warnings about data limitations, estimates used, or assumptions made.",
			),

		dataSource: DataSourceInfoSchema.describe(
			"Metadata about data sources and estimation quality for transparency.",
		),
	})
	.describe(
		"Complete structured investment analysis output. All monetary values are in major currency units. All fields are required and non-null.",
	);

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
