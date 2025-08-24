import {
	type AnalysisOutput,
	AnalysisOutputSchema,
} from "@/app/api/modules/agents/subagents/analyse-investment-agent/_schema";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrency } from "@/lib/helpers/get-currency";
import { prisma } from "@/lib/integration/prisma";
import { cn } from "@/lib/utils";
import { getAuth } from "@everipedia/iq-login";
import type { Property } from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
	AlertCircle,
	ArrowLeft,
	BarChart3,
	Bot,
	Code2,
	DollarSign,
	FileText,
	MapPin,
	Shield,
	TrendingUp,
	Vote,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddToPortfolioControls } from "./_components/add-to-portfolio";
import { AnalysisMarkdown } from "./_components/analysis-markdown";
import { propertyMetadataSchema } from "./_schema";

export default async function AnalysisPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const analysisId = (await params).id;

	const { token, address } = await getAuth();
	if (!address || !token) redirect(`/login?from=/analysis/${analysisId}`);

	const analysis = await prisma.analysis.findUnique({
		where: { id: analysisId },
		include: { property: true },
	});

	if (!analysis) {
		redirect("/");
	}

	const property = analysis.property;

	const metaParsed = propertyMetadataSchema.safeParse(property?.metadata);
	const metadata = metaParsed.success ? metaParsed.data : undefined;

	const analysisResult = AnalysisOutputSchema.safeParse(analysis.data);
	const analysisData: AnalysisOutput | undefined = analysisResult.success
		? analysisResult.data
		: undefined;

	const analysisProgress = analysisData ? 100 : 10;

	return (
		<div className="min-h-screen bg-background">
			<div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-7xl mx-auto p-4 md:p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Link
								href="/discovery"
								className={cn(
									buttonVariants({ variant: "ghost", size: "sm" }),
									"hover:bg-primary/10 hover:text-primary",
								)}
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Back
							</Link>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span className="text-foreground font-medium">AI Analysis</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Badge className="bg-primary/20 text-primary border-primary/30">
								{analysisData?.status || "ANALYZING"}
							</Badge>
							<AddToPortfolioControls propertyId={property.id} />
						</div>
					</div>
				</div>
			</div>

			<div className="border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
				<div className="max-w-6xl mx-auto p-4 md:p-6">
					<div className="flex items-start gap-6">
						<div className="w-72 h-48 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center">
							{metadata?.photos?.[0] ? (
								<Image
									src={
										metadata.photos[0] ||
										"https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVhbCUyMGVzdGF0ZXxlbnwwfHwwfHx8MA%3D%3D"
									}
									alt="Property"
									className="w-full h-full object-cover rounded-xl"
								/>
							) : (
								<Image
									src={
										"https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVhbCUyMGVzdGF0ZXxlbnwwfHwwfHx8MA%3D%3D"
									}
									alt="Property"
									className="w-full h-full object-cover rounded-xl"
									width={280}
									height={192}
								/>
							)}
						</div>

						<div className="flex-1">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
									<Bot className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h1 className="text-2xl font-semibold text-foreground">
										{property?.address || "Property Analysis"}
									</h1>
									<p className="text-muted-foreground flex items-center gap-1">
										<MapPin className="w-4 h-4" />
										{property?.city && property?.country
											? `${property.city}, ${property.country}`
											: "Location TBD"}
									</p>
								</div>
							</div>

							<div className="space-y-3">
								<div className="text-3xl font-bold text-foreground">
									{formatPrice(property)}
								</div>

								{metadata && (
									<div className="text-sm text-muted-foreground">
										{metadata.type && `${metadata.type} • `}
										{metadata.bedrooms && `${metadata.bedrooms} bed • `}
										{metadata.bathrooms && `${metadata.bathrooms} bath • `}
										{metadata.sqft && `${metadata.sqft.toLocaleString()} sq ft`}
									</div>
								)}

								{analysisData?.highlights && (
									<div className="flex items-center gap-2 my-2 flex-wrap">
										{analysisData.highlights.map((highlight, i) => (
											<Badge
												key={`highlight-${i + 1}`}
												className="bg-primary/20 text-primary border-primary/30 text-xs"
											>
												{highlight}
											</Badge>
										))}
									</div>
								)}

								{analysisData?.metrics && (
									<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
										<div className="text-center">
											<div className="text-lg font-semibold text-foreground">
												{formatPercentage(analysisData.metrics.grossYieldPct)}
											</div>
											<div className="text-xs text-muted-foreground">
												Gross Yield
											</div>
										</div>
										<div className="text-center">
											<div className="text-lg font-semibold text-foreground">
												{formatPercentage(analysisData.metrics.capRatePct)}
											</div>
											<div className="text-xs text-muted-foreground">
												Cap Rate
											</div>
										</div>
										<div className="text-center">
											<div className="text-lg font-semibold text-foreground">
												{formatPercentage(analysisData.metrics.roiPct)}
											</div>
											<div className="text-xs text-muted-foreground">
												5Y ROI
											</div>
										</div>
										<div className="text-center">
											<div className="text-lg font-semibold text-foreground">
												{analysisData.metrics.rentVsBuy}
											</div>
											<div className="text-xs text-muted-foreground">
												Recommendation
											</div>
										</div>
										<div className="text-center">
											<div className="text-lg font-semibold text-foreground">
												{analysisData.metrics.flipPotential}
											</div>
											<div className="text-xs text-muted-foreground">
												Flip Potential
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{analysisProgress < 100 && (
				<div className="px-6 py-3 bg-primary/10 border-b border-border">
					<div className="max-w-6xl mx-auto flex items-center gap-3">
						<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<span className="text-sm text-foreground">
							Analyzing property data and market trends…
						</span>
						<Progress
							value={analysisProgress}
							className="flex-1 max-w-48 h-2 bg-muted"
						/>
						<span className="text-sm text-primary font-medium">
							{analysisProgress}%
						</span>
					</div>
				</div>
			)}

			<div className="max-w-6xl mx-auto p-4 md:p-6">
				<Tabs defaultValue="analysis" className="space-y-6">
					<TabsList className="grid w-full grid-cols-3 md:grid-cols-4 bg-muted max-w-2xl">
						<TabsTrigger
							value="analysis"
							className="data-[state=active]:bg-card data-[state=active]:text-primary"
						>
							<BarChart3 className="w-4 h-4 mr-2" />
							Market Analysis
						</TabsTrigger>
						<TabsTrigger
							value="memo"
							className="data-[state=active]:bg-card data-[state=active]:text-primary"
						>
							<FileText className="w-4 h-4 mr-2" />
							Investment Memo
						</TabsTrigger>
						<TabsTrigger
							value="contracts"
							className="data-[state=active]:bg-card data-[state=active]:text-primary"
						>
							<Code2 className="w-4 h-4 mr-2" />
							Smart Contracts
						</TabsTrigger>
						<TabsTrigger
							value="proposals"
							className="hidden md:inline-flex data-[state=active]:bg-card data-[state=active]:text-primary"
						>
							<Vote className="w-4 h-4 mr-2" />
							DAO Proposals
						</TabsTrigger>
					</TabsList>
					<TabsContent value="analysis" className="space-y-6">
						{!analysisData ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold text-foreground mb-2">
									Analysis in Progress
								</h3>
								<p className="text-muted-foreground max-w-md">
									We're analyzing this property's market data, financial
									metrics, and investment potential. This usually takes a few
									minutes.
								</p>
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
									<Card className="lg:col-span-2 bg-card border-border">
										<CardHeader>
											<CardTitle className="flex items-center gap-2 text-foreground">
												<TrendingUp className="w-5 h-5 text-primary" />
												Market Analysis Overview
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
												<div className="text-center p-4 bg-muted rounded-lg border border-border">
													<div className="text-2xl font-bold text-foreground">
														{analysisData.marketAnalysis?.trend ||
															"Analyzing..."}
													</div>
													<div className="text-sm text-muted-foreground mt-1">
														Market Trend
													</div>
												</div>
												<div className="text-center p-4 bg-muted rounded-lg border border-border">
													<div className="text-2xl font-bold text-foreground">
														{analysisData.marketAnalysis?.priceGrowthYoYPct
															? formatPercentage(
																	analysisData.marketAnalysis.priceGrowthYoYPct,
																)
															: "N/A"}
													</div>
													<div className="text-sm text-muted-foreground mt-1">
														YoY Growth
													</div>
												</div>
												<div className="text-center p-4 bg-muted rounded-lg border border-border">
													<div className="text-2xl font-bold text-foreground">
														{analysisData.assumptions?.rentAnnual
															? formatCurrency(
																	analysisData.assumptions.rentAnnual * 100,
																	analysisData.metrics?.currency,
																)
															: "N/A"}
													</div>
													<div className="text-sm text-muted-foreground mt-1">
														Annual Rent
													</div>
												</div>
											</div>
											<Separator className="my-4" />
											<div className="space-y-2">
												{analysisData.dataSource && (
													<>
														<p className="text-sm text-foreground">
															<strong>Data Sources:</strong>{" "}
															{analysisData.dataSource.priceSource}
															{analysisData.dataSource.rentSource &&
																`, ${analysisData.dataSource.rentSource}`}
														</p>
														<p className="text-sm text-muted-foreground">
															{analysisData.dataSource.hasComps
																? "Analysis includes comparable rentals and market trend data."
																: "Limited comparable data available - estimates may vary."}
															{analysisData.assumptions?.rentGrowthPct &&
																` Projections assume ${formatPercentage(
																	analysisData.assumptions.rentGrowthPct,
																)} annual rent growth.`}
														</p>
													</>
												)}
												{analysisData.warnings?.length > 0 && (
													<div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
														<div className="flex items-start gap-2">
															<AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
															<div>
																<p className="text-sm font-medium text-yellow-800">
																	Analysis Warnings
																</p>
																<ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
																	{analysisData.warnings.map((warning, i) => (
																		<li key={`warnings-${i + 1}`}>{warning}</li>
																	))}
																</ul>
															</div>
														</div>
													</div>
												)}
											</div>
										</CardContent>
									</Card>

									{analysisData.marketAnalysis?.risk && (
										<Card className="bg-card border-border">
											<CardHeader>
												<CardTitle className="flex items-center gap-2 text-foreground">
													<Shield className="w-5 h-5 text-primary" />
													Risk Assessment
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="space-y-3">
													{Object.entries(analysisData.marketAnalysis.risk).map(
														([key, value]) => (
															<div key={key} className="space-y-2">
																<div className="flex justify-between text-sm">
																	<span className="text-foreground font-medium capitalize">
																		{key} Risk
																	</span>
																	<Badge
																		className={`text-xs ${getRiskColor(
																			value as string,
																		)}`}
																	>
																		{value as string}
																	</Badge>
																</div>
																<Progress
																	value={getRiskValue(value as string)}
																	className="h-2 bg-muted"
																/>
															</div>
														),
													)}
												</div>
											</CardContent>
										</Card>
									)}
								</div>

								{analysisData.projection5y && (
									<Card className="bg-card border-border">
										<CardHeader>
											<CardTitle className="flex items-center gap-2 text-foreground">
												<DollarSign className="w-5 h-5 text-primary" />
												5-Year Financial Projections
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												{analysisData.projection5y.map((year) => (
													<div
														key={year.year}
														className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border"
													>
														<span className="font-medium text-foreground">
															Year {year.year}
														</span>
														<div className="flex items-center gap-6 text-sm">
															<div className="text-right">
																<div className="font-medium text-foreground">
																	{formatCurrency(
																		year.income * 100,
																		analysisData.metrics?.currency,
																	)}
																</div>
																<div className="text-xs text-muted-foreground">
																	Income
																</div>
															</div>
															<div className="text-right">
																<div className="font-medium text-foreground">
																	{formatCurrency(
																		year.net * 100,
																		analysisData.metrics?.currency,
																	)}
																</div>
																<div className="text-xs text-muted-foreground">
																	Net
																</div>
															</div>
															<div className="text-right">
																<div className="font-medium text-green-400">
																	{formatPercentage(year.roiPct)}
																</div>
																<div className="text-xs text-muted-foreground">
																	ROI
																</div>
															</div>
														</div>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}
							</>
						)}
					</TabsContent>
					<TabsContent value="memo" className="space-y-6">
						{!analysisData?.memoMarkdown ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<FileText className="w-12 h-12 text-muted-foreground mb-4" />
								<h3 className="text-lg font-semibold text-foreground mb-2">
									Investment Memo Not Available
								</h3>
								<p className="text-muted-foreground max-w-md">
									The detailed investment memo is being generated. This
									comprehensive analysis will include market insights, financial
									projections, and investment recommendations.
								</p>
							</div>
						) : (
							<Card className="bg-card border-border">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-foreground">
										<FileText className="w-5 h-5 text-primary" />
										Investment Memo
									</CardTitle>
								</CardHeader>
								<CardContent>
									<AnalysisMarkdown markdown={analysisData.memoMarkdown} />
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="contracts" className="space-y-6">
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<Code2 className="w-12 h-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold text-foreground mb-2">
								Smart Contract Generation
							</h3>
							<p className="text-muted-foreground max-w-md">
								Property tokenization contracts will be generated here. This
								feature allows you to create blockchain-based ownership
								structures for fractional real estate investment.
							</p>
						</div>
					</TabsContent>

					<TabsContent value="proposals" className="space-y-6">
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<Vote className="w-12 h-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold text-foreground mb-2">
								DAO Proposal Creation
							</h3>
							<p className="text-muted-foreground max-w-md">
								Submit this investment opportunity to decentralized investment
								DAOs. This feature helps you create governance proposals for
								community-driven real estate investments.
							</p>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

const formatCurrency = (amountMinor?: number, currency = "USD") => {
	if (amountMinor === null || amountMinor === undefined) return "N/A";
	const amount = amountMinor / 100;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
};

const formatPrice = (property: Property) => {
	const { priceMinor: amountMinor, currency } = getCurrency(property);

	if (amountMinor === null || amountMinor === undefined) return "N/A";
	const amount = amountMinor / 100;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
};

const formatPercentage = (value?: number | null) => {
	if (value === null || value === undefined) return "N/A";
	return `${value.toFixed(1)}%`;
};

const getRiskColor = (level: string) => {
	switch (level) {
		case "Low":
		case "Very Low":
			return "bg-green-600/20 text-green-400 border-green-600/30";
		case "Medium":
			return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
		case "High":
			return "bg-red-600/20 text-red-400 border-red-600/30";
		default:
			return "bg-gray-600/20 text-gray-400 border-gray-600/30";
	}
};

const getRiskValue = (level: string) => {
	switch (level) {
		case "Very Low":
			return 15;
		case "Low":
			return 30;
		case "Medium":
			return 60;
		case "High":
			return 85;
		default:
			return 50;
	}
};
