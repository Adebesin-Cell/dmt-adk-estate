"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrency } from "@/lib/helpers/get-currency";
import { cn } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import {
	AlertTriangle,
	BarChart3,
	CheckCircle2,
	Clock,
	Coins,
	MapPin,
	Search,
	Target,
	TrendingUp,
	Vote,
} from "lucide-react";
import Link from "next/link";

import {
	type AnalysisOutput,
	AnalysisOutputSchema,
} from "@/app/api/modules/agents/subagents/analyse-investment-agent/_schema";

import propertiesData from "@/app/assets/data/properties.json";

type DashboardProps = {
	user: Prisma.UserGetPayload<{
		include: {
			preferences: true;
			savedProps: { include: { property: { include: { analyses: true } } } };
			proposals: { include: { property: true } };
		};
	}>;
};

export function Dashboard({ user }: DashboardProps) {
	const savedProps = user?.savedProps ?? [];
	const proposals = user?.proposals ?? [];
	const regionLabel = regionLabelFromUser(user);

	const primaryCurrency = getPrimaryCurrency(savedProps);

	const portfolioTotalMinor = savedProps.reduce((sum, s) => {
		const analysis = getLatestAnalysis(s.property);
		if (analysis?.metrics) {
			return sum + analysis.metrics.purchasePrice * 100;
		}
		return sum + (getCurrency(s.property).priceMinor ?? 0);
	}, 0);

	const analysedItems = savedProps
		.map((sp) => {
			const prop = sp.property;
			if (!prop) return null;
			const latest = (prop.analyses ?? [])[0] || null;
			if (!latest) return null;
			const parsed = AnalysisOutputSchema.safeParse(latest.data);
			console.log(parsed.error);
			const data: AnalysisOutput | null = parsed.success ? parsed.data : null;
			return { sp, property: prop, analysis: latest, data };
		})
		.filter((x): x is NonNullable<typeof x> => !!x && !!x.data);

	const avg = (arr: number[]) =>
		arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

	const avgRoi = avg(
		analysedItems
			.map((i) => i.data?.metrics?.totalROI5YearPct)
			.filter((v): v is number => typeof v === "number"),
	);

	const avgCap = avg(
		analysedItems
			.map((i) => i.data?.metrics?.capRatePct)
			.filter((v): v is number => typeof v === "number"),
	);

	const avgYield = avg(
		analysedItems
			.map((i) => i.data?.metrics?.grossYieldPct)
			.filter((v): v is number => typeof v === "number"),
	);

	const pendingProposals = proposals.filter(
		(p) => !["APPROVED", "REJECTED"].includes(p.status ?? ""),
	);
	const pendingValueMinor = pendingProposals.reduce((sum, p) => {
		// Try to get value from analysis first, then property
		const analysis = getLatestAnalysis(p.property);
		if (analysis?.metrics) {
			return sum + analysis.metrics.purchasePrice * 100;
		}
		const { priceMinor } = getCurrency(p.property);
		return sum + (priceMinor ?? 0);
	}, 0);

	const totalSaved = savedProps.length;
	const analysedCount = analysedItems.length;
	const newLeads7d = savedProps.filter((s) =>
		isWithinDays(s.createdAt, 7),
	).length;
	const proposalApproved = proposals.filter(
		(p) => p.status === "APPROVED",
	).length;

	const agents = [
		{
			name: "Property Discovery",
			icon: Search,
			efficiency: clampPercent(
				((totalSaved ? totalSaved : 0) * 100) / Math.max(totalSaved, 1),
			),
			activeScans: totalSaved,
			newLeads: newLeads7d,
		},
		{
			name: "Investment Analysis",
			icon: BarChart3,
			efficiency: clampPercent((analysedCount / Math.max(totalSaved, 1)) * 100),
			activeScans: analysedCount,
			newLeads: Math.max(analysedCount - (totalSaved - newLeads7d), 0),
		},
		{
			name: "Tokenization Engine",
			icon: Coins,
			efficiency: clampPercent(
				(proposalApproved / Math.max(proposals.length || 1, 1)) * 100,
			),
			activeScans: proposals.length,
			newLeads: proposalApproved,
		},
	];

	const opportunities = [...analysedItems]
		.sort(
			(a, b) =>
				(b.data?.metrics?.totalROI5YearPct ?? 0) -
				(a.data?.metrics?.totalROI5YearPct ?? 0),
		)
		.slice(0, 6)
		.map(({ property, data, analysis }) => {
			const metrics = data?.metrics;
			const signal = classifySignal(
				metrics?.totalROI5YearPct,
				metrics?.capRatePct,
				metrics?.grossYieldPct,
			);
			const status = classifyStatus(
				proposals.find((p) => p.propertyId === property.id)?.status,
			);
			const confidence = estimateConfidence(data);
			return {
				id: analysis.id,
				propertyId: property.id,
				addr: property.address ?? property.city ?? "Unnamed property",
				loc: [property.city, property.country].filter(Boolean).join(", "),
				totalROI5YearPct: metrics?.totalROI5YearPct ?? null,
				capRatePct: metrics?.capRatePct ?? null,
				grossYieldPct: metrics?.grossYieldPct ?? null,
				signal,
				status,
				confidence,
				currency: metrics?.currency ?? primaryCurrency,
			};
		});

	const portfolioRows = savedProps.map((sp) => {
		const p = sp.property;
		const latest = p?.analyses?.[0];
		const parsed = latest ? AnalysisOutputSchema.safeParse(latest.data) : null;
		const data: AnalysisOutput | null = parsed?.success ? parsed.data : null;

		const meta = safeMeta(p?.metadata);
		const type =
			meta?.type?.toString().toLowerCase() ||
			inferTypeFromBedBath(meta?.bedrooms, meta?.bathrooms) ||
			"residential";

		const riskOverall = summarizeRisk(data);
		const perf = perfFromRoi(data?.metrics?.totalROI5YearPct);

		// Use analysis currency if available
		const currency = data?.metrics?.currency ?? p?.currency ?? primaryCurrency;
		const valueMinor = data?.metrics
			? data.metrics.purchasePrice * 100
			: getCurrency(p).priceMinor ?? 0;

		return {
			id: sp.id,
			name: p?.address ?? p?.city ?? "Untitled Property",
			city: p?.city,
			country: p?.country,
			tokens: `${(meta?.shares as number | undefined) ?? ""}`.trim(),
			valueMinor,
			currency,
			performanceText: perf.text,
			performanceClass: perf.className,
			type,
			risk: riskOverall.level,
			riskClass: riskOverall.className,
		};
	});

	const alerts = buildDummyAlertsFromJSON(propertiesData, primaryCurrency);

	return (
		<div className="p-6 bg-background space-y-6 max-w-7xl mx-auto">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-card border-border">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Total Portfolio Value
								</p>
								<p className="text-2xl font-semibold text-foreground">
									{formatMoney(portfolioTotalMinor, primaryCurrency)}
								</p>
								<p className="text-sm text-primary">
									{avgYield ? `Avg Yield ${formatPct(avgYield)}` : "—"}
								</p>
							</div>
							<TrendingUp className="w-8 h-8 text-primary" />
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card border-border">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Active Investments
								</p>
								<p className="text-2xl font-semibold text-foreground">
									{savedProps.length}
								</p>
								<p className="text-sm text-primary">
									{analysedCount}/{savedProps.length} analyzed
								</p>
							</div>
							<Target className="w-8 h-8 text-primary" />
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card border-border">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Avg ROI (5yr)</p>
								<p className="text-2xl font-semibold text-foreground">
									{avgRoi ? formatPct(avgRoi) : "—"}
								</p>
								<p className="text-sm text-primary">
									Cap {avgCap ? formatPct(avgCap) : "—"}
								</p>
							</div>
							<BarChart3 className="w-8 h-8 text-primary" />
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card border-border">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Pending Deals</p>
								<p className="text-2xl font-semibold text-foreground">
									{pendingProposals.length}
								</p>
								<p className="text-sm text-muted-foreground">
									{formatMoney(pendingValueMinor, primaryCurrency)} value
								</p>
							</div>
							<Clock className="w-8 h-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold text-foreground">
						Real Estate AI Agent Status
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{agents.map((agent) => {
						const Icon = agent.icon;
						return (
							<Card key={agent.name} className="bg-card border-border">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-2">
										<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
											<Icon className="w-4 h-4 text-primary" />
										</div>
										<Badge
											variant="secondary"
											className={cn(
												"text-xs",
												agent.efficiency >= 95
													? "bg-green-600 text-white border-0"
													: agent.efficiency >= 85
														? "bg-blue-500/10 text-blue-500 border-blue-500/20"
														: "bg-orange-500/10 text-orange-500 border-orange-500/20",
											)}
										>
											{Math.round(agent.efficiency)}%
										</Badge>
									</div>
									<h3 className="font-medium text-foreground mb-1">
										{agent.name}
									</h3>
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">Activity</span>
											<span className="text-foreground">
												{agent.activeScans}
											</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">New (7d)</span>
											<span className="text-primary">{agent.newLeads}</span>
										</div>
										<Progress
											value={Math.round(agent.efficiency)}
											className="h-2"
										/>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 grid-rows-auto">
					<div className="lg:col-span-2">
						<Card className="bg-card border-border h-full flex flex-col">
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle className="text-foreground">
									Investment Opportunities
								</CardTitle>
								<div className="flex items-center gap-2">
									<Link href="/discovery">
										<Button
											variant="outline"
											size="sm"
											className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
										>
											View All
										</Button>
									</Link>
								</div>
							</CardHeader>
							<CardContent className="space-y-4 flex-1">
								{opportunities.length === 0 ? (
									<div className="text-sm text-muted-foreground">
										No analyzed opportunities yet.
									</div>
								) : (
									opportunities.map((op) => (
										<Link key={op.id} href={`/analysis/${op.id}`}>
											<div className="bg-muted/30 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
												<div className="flex items-start justify-between mb-2">
													<div>
														<h4 className="font-medium text-foreground">
															{op.addr}
														</h4>
														<p className="text-sm text-muted-foreground flex items-center gap-1">
															<MapPin className="w-3 h-3" />
															{op.loc}
														</p>
													</div>
													<div className="flex gap-2">
														<Badge
															variant="secondary"
															className={cn(
																op.signal === "HIGH YIELD" &&
																	"bg-green-600 text-white border-0",
																op.signal === "APPRECIATION" &&
																	"bg-blue-600 text-white border-0",
																op.signal === "CASH FLOW" &&
																	"bg-purple-600 text-white border-0",
																op.signal === "SPECIAL" &&
																	"bg-amber-600 text-white border-0",
															)}
														>
															{op.signal}
														</Badge>
														<Badge
															variant="outline"
															className={cn(
																op.status === "ready" &&
																	"bg-green-500/10 text-green-500 border-green-500/20",
																op.status === "evaluation" &&
																	"bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
																op.status === "analysis" &&
																	"bg-blue-500/10 text-blue-500 border-blue-500/20",
															)}
														>
															{op.status}
														</Badge>
													</div>
												</div>
												<div className="grid grid-cols-3 gap-4 text-sm">
													<div>
														<span className="text-muted-foreground">
															ROI (5yr):
														</span>
														<span className="ml-1 text-primary font-medium">
															{op.totalROI5YearPct != null
																? formatPct(op.totalROI5YearPct)
																: "N/A"}
														</span>
													</div>
													<div>
														<span className="text-muted-foreground">
															Cap Rate:
														</span>
														<span className="ml-1 text-foreground">
															{op.capRatePct != null
																? formatPct(op.capRatePct)
																: "N/A"}
														</span>
													</div>
													<div>
														<span className="text-muted-foreground">
															Confidence:
														</span>
														<span className="ml-1 text-foreground">
															{typeof op.confidence === "number"
																? `${op.confidence}%`
																: "N/A"}
														</span>
													</div>
												</div>
											</div>
										</Link>
									))
								)}
							</CardContent>
						</Card>
					</div>

					<div>
						<Card className="bg-card border-border h-full flex flex-col">
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle className="text-foreground">
									Portfolio Overview
								</CardTitle>
								<div className="flex items-center gap-2">
									<Link href="/portfolio">
										<Button
											variant="outline"
											size="sm"
											className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
										>
											Manage
										</Button>
									</Link>
								</div>
							</CardHeader>
							<CardContent className="space-y-3 flex-1">
								{portfolioRows.length === 0 ? (
									<div className="text-center py-10 space-y-3">
										<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border">
											<Badge
												variant="secondary"
												className="bg-primary/10 text-primary border-primary/20"
											>
												Getting started
											</Badge>
											<span className="text-sm text-muted-foreground">
												No properties yet
											</span>
										</div>
										<p className="text-muted-foreground">
											Save a property to start building your portfolio in{" "}
											{regionLabel} markets.
										</p>
										<Link
											href="/discovery"
											className={cn(
												buttonVariants({ variant: "outline" }),
												"cursor-pointer",
											)}
										>
											Explore Properties
										</Link>
									</div>
								) : (
									portfolioRows.map((item) => (
										<div
											key={item.id}
											className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border"
										>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="font-medium text-foreground text-sm">
														{item.name}
													</h4>
													<Badge
														variant="secondary"
														className={cn(
															"text-xs",
															item.type === "residential" &&
																"bg-blue-500/10 text-blue-500 border-blue-500/20",
															item.type === "commercial" &&
																"bg-purple-500/10 text-purple-500 border-purple-500/20",
															item.type === "vacation" &&
																"bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
															item.type === "office" &&
																"bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
															item.type === "heritage" &&
																"bg-amber-500/10 text-amber-500 border-amber-500/20",
														)}
													>
														{item.type}
													</Badge>
												</div>
												<p className="text-xs text-muted-foreground">
													{[item.city, item.country].filter(Boolean).join(", ")}
												</p>
												<div className="mt-1 flex items-center gap-2">
													<Badge variant="secondary" className="text-xs">
														{item.currency}
													</Badge>
													<Badge
														variant="secondary"
														className={cn("text-xs", item.riskClass)}
													>
														{item.risk} risk
													</Badge>
												</div>
											</div>
											<div className="text-right">
												<p className="text-sm font-medium text-foreground">
													{formatMoney(item.valueMinor, item.currency)}
												</p>
												<Badge
													variant="secondary"
													className={cn("text-xs", item.performanceClass)}
												>
													{item.performanceText}
												</Badge>
											</div>
										</div>
									))
								)}
							</CardContent>
						</Card>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<Card className="bg-card border-border h-full flex flex-col">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-foreground">Property Alerts</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 flex-1">
							{alerts.map((alert) => (
								<div
									key={alert.time}
									className="flex items-start gap-3 p-3 rounded-lg"
								>
									<Badge
										variant="secondary"
										className={cn(
											"text-xs",
											alert.type === "performance" &&
												"bg-green-600 text-white border-0",
											alert.type === "opportunity" &&
												"bg-blue-500/10 text-blue-500 border-blue-500/20",
											alert.type === "risk" && "bg-red-600 text-white border-0",
											alert.type === "governance" &&
												"bg-purple-500/10 text-purple-500 border-purple-500/20",
										)}
									>
										{alert.type}
									</Badge>
									<div className="flex-1">
										<p className="text-sm text-foreground">{alert.message}</p>
										<div className="flex items-center gap-2 mt-1">
											<p className="text-xs text-muted-foreground">
												{alert.time}
											</p>
											<Badge
												variant="secondary"
												className={cn(
													"text-xs",
													alert.priority === "urgent" &&
														"bg-red-600 text-white border-0",
													alert.priority === "high" &&
														"bg-orange-500/10 text-orange-500 border-orange-500/20",
													alert.priority === "medium" &&
														"bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
													alert.priority === "low" &&
														"bg-green-500/10 text-green-500 border-green-500/20",
												)}
											>
												{alert.priority}
											</Badge>
										</div>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="bg-card border-border h-full flex flex-col">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-foreground">DAO Proposals</CardTitle>
							{proposals.length > 0 && (
								<Badge
									variant="secondary"
									className="bg-primary/10 text-primary border-primary/20"
								>
									{proposals.length} total
								</Badge>
							)}
						</CardHeader>
						<CardContent className="space-y-4 flex-1">
							{proposals.length === 0 ? (
								<div className="text-center py-6 space-y-3">
									<p className="text-muted-foreground">No proposals yet.</p>
									<Link
										href="/proposals/new"
										className={cn(
											buttonVariants({ variant: "outline" }),
											"cursor-pointer",
										)}
									>
										Create Proposal
									</Link>
								</div>
							) : (
								proposals.map((p) => (
									<div
										key={p.id}
										className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="font-medium text-foreground text-sm">
													{p.title}
												</h4>
												<Badge
													variant="secondary"
													className={cn(
														"text-xs",
														p.status === "APPROVED" &&
															"bg-green-600 text-white border-0",
														p.status === "DRAFT" &&
															"bg-blue-500/10 text-blue-500 border-blue-500/20",
														p.status === "REJECTED" &&
															"bg-red-600 text-white border-0",
														p.status === "PENDING" &&
															"bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
													)}
												>
													{p.status}
												</Badge>
											</div>
											<p className="text-xs text-muted-foreground">
												{p.property?.address
													? `Related: ${p.property.address}`
													: "Standalone proposal"}
											</p>
										</div>
										<div className="text-right">
											<Link href={`/proposals/${p.id}`}>
												<Button
													variant="ghost"
													size="sm"
													className="text-primary hover:bg-primary/10"
												>
													<Vote className="w-3 h-3 mr-1" />
													View
												</Button>
											</Link>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>

					<Card className="bg-card border-border h-full flex flex-col">
						<CardHeader>
							<CardTitle className="text-foreground">System Health</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 flex-1">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									API Status
								</span>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary" />
									<span className="text-sm text-foreground">Operational</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									Data Pipeline
								</span>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary" />
									<span className="text-sm text-foreground">Active</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									Smart Contracts
								</span>
								<div className="flex items-center gap-2">
									<AlertTriangle className="w-4 h-4 text-yellow-500" />
									<span className="text-sm text-foreground">1 Warning</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">AI Models</span>
								<div className="flex items-center gap-2">
									<CheckCircle2 className="w-4 h-4 text-primary" />
									<span className="text-sm text-foreground">Running</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

// Helper function to get the latest analysis from a property
function getLatestAnalysis(property: any): AnalysisOutput | null {
	if (!property?.analyses?.[0]) return null;
	const parsed = AnalysisOutputSchema.safeParse(property.analyses[0].data);
	return parsed.success ? parsed.data : null;
}

// Helper function to determine primary currency
function getPrimaryCurrency(savedProps: any[]): string {
	// Try to get currency from analysis data first
	for (const sp of savedProps) {
		const analysis = getLatestAnalysis(sp.property);
		if (analysis?.metrics?.currency) {
			return analysis.metrics.currency;
		}
	}

	// Fall back to property currency
	const propertyCurrency = savedProps.find((s) => s.property?.currency)
		?.property?.currency;
	return propertyCurrency ?? "EUR";
}

function formatMoney(minor?: number | null, currency = "EUR") {
	if (!minor || minor <= 0) return "—";
	const value = minor / 100;
	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency,
			maximumFractionDigits: 0,
		}).format(value);
	} catch {
		return `${value.toLocaleString()} ${currency}`;
	}
}

function formatPct(v?: number | null) {
	if (v == null) return "N/A";
	return `${v.toFixed(1)}%`;
}

function clampPercent(v: number) {
	if (Number.isNaN(v)) return 0;
	return Math.min(100, Math.max(0, v));
}

function isWithinDays(date: Date | string | undefined, days: number) {
	if (!date) return false;
	const d = typeof date === "string" ? new Date(date) : date;
	const diff = Date.now() - d.getTime();
	return diff <= days * 24 * 3600 * 1000;
}

function regionLabelFromUser(
	user: Prisma.UserGetPayload<{
		include: {
			savedProps: { include: { property: { include: { analyses: true } } } };
			proposals: { include: { property: true } };
			preferences: true;
		};
	}> | null,
) {
	const locs = user?.preferences?.locations ?? [];
	if (!locs.length) return "your";
	if (locs.length === 1) return locs[0];
	if (locs.length === 2) return `${locs[0]} & ${locs[1]}`;
	return `${locs[0]}, ${locs[1]} +${locs.length - 2}`;
}

function classifySignal(
	roi?: number | null,
	cap?: number | null,
	grossYield?: number | null,
): "HIGH YIELD" | "APPRECIATION" | "CASH FLOW" | "SPECIAL" {
	const r = roi ?? 0;
	const c = cap ?? 0;
	const y = grossYield ?? 0;
	if (y >= 8 || c >= 7) return "HIGH YIELD";
	if (r >= 14 && c < 6) return "APPRECIATION";
	if (y >= 6) return "CASH FLOW";
	return "SPECIAL";
}

function classifyStatus(status?: string | null) {
	switch (status) {
		case "APPROVED":
			return "ready";
		case "PENDING":
			return "evaluation";
		default:
			return "analysis";
	}
}

function estimateConfidence(data?: AnalysisOutput | null): number | null {
	if (!data) return null;

	let score = 90;
	const warnCount = data.warnings?.length ?? 0;
	score -= warnCount * 5;

	const risk = data.marketAnalysis?.risk ?? {};
	for (const lvl of Object.values(risk)) {
		switch (String(lvl)) {
			case "Very Low":
				score -= 0;
				break;
			case "Low":
				score -= 2;
				break;
			case "Medium":
				score -= 6;
				break;
			case "High":
				score -= 12;
				break;
			default:
				score -= 3;
		}
	}

	return Math.max(40, Math.min(99, Math.round(score)));
}

function safeMeta(meta: unknown): Record<string, unknown> | null {
	if (!meta || typeof meta !== "object") return null;
	return meta as Record<string, unknown>;
}

function inferTypeFromBedBath(beds?: unknown, baths?: unknown) {
	const b = Number(beds ?? 0);
	const ba = Number(baths ?? 0);
	if (Number.isFinite(b) && Number.isFinite(ba)) {
		if (b >= 3) return "residential";
		if (b <= 2 && ba <= 1) return "residential";
	}
	return undefined;
}

function summarizeRisk(data?: AnalysisOutput | null): {
	level: "low" | "medium" | "high";
	className: string;
} {
	if (!data?.marketAnalysis?.risk)
		return {
			level: "medium",
			className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
		};
	const levels = Object.values(data.marketAnalysis.risk).map((v) => String(v));
	const score = levels.reduce((acc, l) => {
		switch (l) {
			case "Very Low":
				return acc + 1;
			case "Low":
				return acc + 2;
			case "Medium":
				return acc + 3;
			case "High":
				return acc + 4;
			default:
				return acc + 3;
		}
	}, 0);
	const avg = score / Math.max(levels.length || 1, 1);

	if (avg <= 2)
		return {
			level: "low",
			className: "bg-green-500/10 text-green-500 border-green-500/20",
		};
	if (avg < 3.5)
		return {
			level: "medium",
			className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
		};
	return {
		level: "high",
		className: "bg-red-500/10 text-red-500 border-red-500/20",
	};
}

function perfFromRoi(roi?: number | null) {
	if (roi == null)
		return {
			text: "—",
			className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
		};
	if (roi >= 18)
		return {
			text: `+${roi.toFixed(1)}%`,
			className: "bg-green-600 text-white border-0",
		};
	if (roi >= 8)
		return {
			text: `+${roi.toFixed(1)}%`,
			className: "bg-green-500/10 text-green-500 border-green-500/20",
		};
	if (roi >= 0)
		return {
			text: `+${roi.toFixed(1)}%`,
			className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
		};
	return {
		text: `${roi.toFixed(1)}%`,
		className: "bg-red-600 text-white border-0",
	};
}

function buildDummyAlertsFromJSON(json: any, currency: string) {
	const picks: Array<{ city?: string; priceMinor?: number }> = [];
	const buckets = Object.values(json ?? {}) as any[];
	for (const arr of buckets) {
		if (Array.isArray(arr)) {
			for (const p of arr.slice(0, 2)) {
				picks.push({ city: p.city, priceMinor: p.priceMinor });
			}
		}
	}
	const fmt = (m?: number) => (m ? formatMoney(m, currency) : "—");
	return [
		{
			type: "performance",
			message: `Portfolio outperformed benchmark; top city: ${picks[0]?.city ?? "N/A"}`,
			time: "2h ago",
			priority: "high",
		},
		{
			type: "opportunity",
			message: `New listing surge in ${picks[1]?.city ?? "selected markets"}`,
			time: "4h ago",
			priority: "medium",
		},
		{
			type: "risk",
			message: `Price volatility flagged near ${picks[2]?.city ?? "a watched market"} (${fmt(
				picks[2]?.priceMinor,
			)})`,
			time: "6h ago",
			priority: "high",
		},
		{
			type: "governance",
			message: "Proposal voting windows open this week",
			time: "8h ago",
			priority: "low",
		},
	] as Array<{
		type: "performance" | "opportunity" | "risk" | "governance";
		message: string;
		time: string;
		priority: "low" | "medium" | "high" | "urgent";
	}>;
}
