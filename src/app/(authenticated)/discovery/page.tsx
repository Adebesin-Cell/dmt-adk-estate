import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/integration/prisma";
import { getAuth } from "@everipedia/iq-login";
import type { Prisma } from "@prisma/client";
import {
	ArrowRight,
	BarChart3,
	CheckCircle,
	Search,
	Star,
	Target,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PropertyCard } from "./_components/property-card";
import { ScanControls } from "./_components/scan-control";

export default async function DiscoveryPage() {
	const { token, address } = await getAuth();
	if (!address || !token) redirect("/login?from=/discovery");

	const user = await prisma.user.findUnique({
		where: { wallet: address.toLowerCase() },
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
		include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
		orderBy: { createdAt: "desc" },
	});

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
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
						<TrendingUp className="w-5 h-5 text-primary" />
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

								<div className="mt-4 text-left mx-auto max-w-sm space-y-3">
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
											<Search className="w-3.5 h-3.5 text-primary" />
										</div>
										<div>
											<div className="text-sm font-medium text-foreground">
												1. Scan the market
											</div>
											<div className="text-xs text-muted-foreground">
												Use the{" "}
												<span className="font-medium">Scan for Properties</span>{" "}
												button above to search based on your preferences.
											</div>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
											<BarChart3 className="w-3.5 h-3.5 text-primary" />
										</div>
										<div>
											<div className="text-sm font-medium text-foreground">
												2. Analyze with AI
											</div>
											<div className="text-xs text-muted-foreground">
												Open any card and choose{" "}
												<span className="font-medium">Analyze with AI</span> for
												ROI, yield, and cap rate.
											</div>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
											<Star className="w-3.5 h-3.5 text-primary" />
										</div>
										<div>
											<div className="text-sm font-medium text-foreground">
												3. Save & compare
											</div>
											<div className="text-xs text-muted-foreground">
												Shortlist promising deals and compare scores
												side-by-side.
											</div>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
											<CheckCircle className="w-3.5 h-3.5 text-primary" />
										</div>
										<div>
											<div className="text-sm font-medium text-foreground">
												4. Propose & execute
											</div>
											<div className="text-xs text-muted-foreground">
												Move winners into proposals and proceed to execution
												when ready.
											</div>
										</div>
									</div>
								</div>

								<div className="flex items-center justify-center pt-2">
									<Button variant="outline" asChild>
										<Link href="/">Explore later</Link>
									</Button>
								</div>

								<div className="text-xs text-muted-foreground">
									Pro tip: set your budget &amp; locations to improve results.
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
					{properties.map((p) => (
						<PropertyCard key={p.id} property={p} />
					))}
				</div>
			)}
		</div>
	);
}
