import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart3, Bot, Coins, Search, Wallet } from "lucide-react";
import Link from "next/link";

export function WelcomeScreen() {
	const from = encodeURIComponent("/");

	return (
		<div className="p-6 max-w-5xl mx-auto space-y-8 mt-12">
			<div className="text-center space-y-4">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border">
					<Badge
						variant="secondary"
						className="bg-primary/10 text-primary border-primary/20"
					>
						New
					</Badge>
					<span className="text-sm text-muted-foreground">
						Connect your wallet to unlock your dashboard
					</span>
				</div>

				<h1 className="text-3xl md:text-4xl font-semibold text-foreground">
					Welcome to <span className="text-primary">REC</span>
				</h1>
				<p className="text-muted-foreground">
					Discover opportunities, analyze returns, and participate in governance
					— all in one place.
				</p>

				<div className="flex items-center justify-center gap-3">
					<Link
						href={`/login?from=${from}`}
						className={cn(buttonVariants({ size: "lg" }), "cursor-pointer")}
					>
						<Wallet className="w-4 h-4 mr-2" />
						Connect Wallet
					</Link>

					<Link
						href="/discovery"
						className={cn(
							buttonVariants({ variant: "outline", size: "lg" }),
							"cursor-pointer",
						)}
					>
						<Search className="w-4 h-4 mr-2" />
						Explore Deals
					</Link>
				</div>

				<div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
					<span>Non-custodial</span> • <span>On-chain governance</span> •{" "}
					<span>Real-time analytics</span>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="bg-card border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-foreground">
							Property Discovery
						</CardTitle>
						<Search className="w-5 h-5 text-primary" />
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						AI-curated leads across EU markets with yield, cap rate, and comps.
					</CardContent>
				</Card>

				<Card className="bg-card border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-foreground">
							Investment Analysis
						</CardTitle>
						<BarChart3 className="w-5 h-5 text-primary" />
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Instant underwriting with risk scores and scenario testing.
					</CardContent>
				</Card>

				<Card className="bg-card border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-foreground">
							Tokenization Engine
						</CardTitle>
						<Coins className="w-5 h-5 text-primary" />
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Seamless asset tokenization and portfolio tracking.
					</CardContent>
				</Card>
			</div>

			<Card className="bg-card border-border">
				<CardContent className="p-5 flex items-center justify-between gap-4">
					<div>
						<h3 className="text-base font-medium text-foreground">
							Need a head start?
						</h3>
						<p className="text-sm text-muted-foreground">
							Our AI Advisor can scan markets and propose a starter portfolio
							once you connect.
						</p>
					</div>

					<Link
						href={`/login?from=${from}`}
						className={cn(
							buttonVariants({ variant: "outline" }),
							"cursor-pointer",
						)}
					>
						<Bot className="w-4 h-4 mr-2" />
						Connect to start
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
