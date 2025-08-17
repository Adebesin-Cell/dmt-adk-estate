import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/integration/prisma";
import { getAuth } from "@everipedia/iq-login";
import type { Currency, Prisma } from "@prisma/client";
import {
	ArrowRight,
	BarChart3,
	CheckCircle,
	Home,
	MapPin,
	Search,
	Star,
	Target,
	TrendingUp,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ScanControls } from "./_components/scan-control";

export default async function DiscoveryPage() {
	const { token, address } = await getAuth();
	if (!address || !token) redirect("/login?from=/discovery");

	const user = await prisma.user.findUnique({
		where: { wallet: address },
		include: { preferences: true },
	});

	const where: Prisma.PropertyWhereInput = {};
	const pref = user?.preferences;

	if (pref?.locations && pref.locations.length > 0)
		where.country = { in: pref.locations };
	if (typeof pref?.budgetMax === "number")
		where.priceMinor = { lte: pref.budgetMax * 100 };
	if (pref?.currency) where.currency = pref.currency;

	const properties = await prisma.property.findMany({
		where,
		include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
		orderBy: { createdAt: "desc" },
		take: 24,
	});

	return (
		<div className="p-6 max-w-5xl mx-auto space-y-8 min-h-screen">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
						<div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
							<Search className="w-6 h-6 text-primary" />
						</div>
						Investment Hub
					</h1>
					<p className="text-sm text-muted-foreground mt-2">
						Discover, analyze, and invest in properties with an autonomous
						workflow
					</p>
				</div>
				<ScanControls />
			</div>

			<Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
				<CardHeader>
					<CardTitle className="text-foreground flex items-center gap-2">
						<Zap className="w-5 h-5 text-primary" />
						Autonomous AI Investment Workflow
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-7 items-center gap-4 max-w-3xl mx-auto">
						<div className="flex flex-col items-center text-center">
							<div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-2">
								<Search className="w-6 h-6 text-primary" />
							</div>
							<div className="text-sm font-medium text-foreground">
								Discover
							</div>
							<div className="text-xs text-muted-foreground">
								AI-curated properties
							</div>
						</div>
						<ArrowRight className="mx-auto text-primary" />
						<div className="flex flex-col items-center text-center">
							<div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-2">
								<TrendingUp className="w-6 h-6 text-primary" />
							</div>
							<div className="text-sm font-medium text-foreground">Analyze</div>
							<div className="text-xs text-muted-foreground">
								ROI & risk modeling
							</div>
						</div>
						<ArrowRight className="mx-auto text-primary" />
						<div className="flex flex-col items-center text-center">
							<div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-2">
								<Target className="w-6 h-6 text-primary" />
							</div>
							<div className="text-sm font-medium text-foreground">Propose</div>
							<div className="text-xs text-muted-foreground">
								DAO proposals & contracts
							</div>
						</div>
						<ArrowRight className="mx-auto text-primary" />
						<div className="flex flex-col items-center text-center">
							<div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-2">
								<CheckCircle className="w-6 h-6 text-primary" />
							</div>
							<div className="text-sm font-medium text-foreground">Execute</div>
							<div className="text-xs text-muted-foreground">
								Autonomous investment
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{properties.length === 0 ? (
				<Card className="bg-card border-border overflow-hidden">
					<CardContent className="p-8">
						<div className="relative mx-auto max-w-md text-center">
							<div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
							<div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
							<div className="relative z-10 space-y-4">
								<div className="w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center mx-auto">
									<Search className="w-8 h-8 text-primary" />
								</div>
								<h3 className="text-lg font-semibold text-foreground">
									No properties yet
								</h3>
								<p className="text-sm text-muted-foreground">
									Kick off a market scan and we’ll start dropping AI-curated
									deals here.
								</p>

								<div className="flex items-center justify-center gap-2">
									<Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
										Agent idle
									</Badge>
									<Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
										0 saved
									</Badge>
								</div>

								<div className="flex items-center justify-center gap-3 pt-2">
									<ScanControls />
									<Button variant="outline" asChild>
										<Link href="/discovery">Explore later</Link>
									</Button>
								</div>

								<div className="text-xs text-muted-foreground">
									Pro tip: set your budget & locations to improve results.
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{properties.map((p) => {
						const latest = (p.analyses?.[0]?.data ??
							null) as AnalysisData | null;
						const score = latest?.score ?? latest?.aiScore;
						const yieldPct =
							latest?.yield ?? latest?.grossYield ?? latest?.netYield;
						const capRate = latest?.capRate;
						const meta = (p.metadata ?? null) as PropertyMetadata | null;

						return (
							<Card
								key={p.id}
								className="bg-card border-border hover:border-primary/30 transition-all group hover:shadow-lg"
							>
								<CardHeader className="p-5 pb-2">
									<div className="flex items-start justify-between gap-3">
										<div>
											<h3 className="text-foreground font-semibold text-lg">
												{p.address ?? "Untitled Property"}
											</h3>
											<div className="flex items-center gap-2 text-muted-foreground mt-1">
												<MapPin className="w-4 h-4" />
												<span className="text-sm">
													{[p.city, p.country].filter(Boolean).join(", ") ||
														"—"}
												</span>
											</div>
										</div>
										{typeof score === "number" && (
											<Badge
												className={`border-0 ${
													score >= 90
														? "bg-green-600 text-white"
														: score >= 80
															? "bg-blue-600 text-white"
															: score >= 70
																? "bg-yellow-600 text-white"
																: "bg-red-600 text-white"
												}`}
											>
												<Star className="w-3 h-3 mr-1" />
												{score}
											</Badge>
										)}
									</div>
								</CardHeader>

								<CardContent className="p-5 space-y-5">
									<div className="grid grid-cols-3 gap-4">
										<div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
											<div className="text-primary font-semibold">
												{formatMoney(p.priceMinor, p.currency)}
											</div>
											<div className="text-muted-foreground text-xs">
												Purchase
											</div>
										</div>
										<div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
											<div className="text-primary font-semibold">
												{yieldPct != null ? `${yieldPct}%` : "—"}
											</div>
											<div className="text-muted-foreground text-xs">Yield</div>
										</div>
										<div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
											<div className="text-primary font-semibold">
												{capRate != null ? `${capRate}%` : "—"}
											</div>
											<div className="text-muted-foreground text-xs">
												Cap Rate
											</div>
										</div>
									</div>

									<div className="flex items-center justify-between text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
										<div className="flex items-center gap-2">
											<Home className="w-4 h-4" />
											<span>
												{meta?.bedrooms ?? "—"} BR / {meta?.bathrooms ?? "—"} BA
											</span>
										</div>
										<div className="flex items-center gap-1">
											<span>{meta?.sqm ? `${meta.sqm} m²` : "—"}</span>
										</div>
									</div>

									<div className="flex gap-3">
										<Button
											asChild
											className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
										>
											<Link href={`/analysis/${p.id}`}>
												<BarChart3 className="w-4 h-4 mr-2" />
												Analyze with AI
											</Link>
										</Button>

										{p.url ? (
											<Button
												variant="outline"
												asChild
												className="flex-1 border-border hover:bg-primary/10"
											>
												<Link href={p.url} target="_blank" rel="noreferrer">
													View Listing
												</Link>
											</Button>
										) : (
											<Button variant="outline" disabled className="flex-1">
												View Listing
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}

type PropertyMetadata = {
	bedrooms?: number;
	bathrooms?: number;
	sqm?: number;
	images?: string[];
	type?: string;
};

type AnalysisData = {
	score?: number;
	aiScore?: number;
	yield?: number;
	grossYield?: number;
	netYield?: number;
	capRate?: number;
};

function formatMoney(minor?: number | null, currency?: Currency | null) {
	if (minor == null) return "—";
	const major = minor / 100;
	const locale = "en-US";
	const code = currency ?? "EUR";
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: code,
	}).format(major);
}
