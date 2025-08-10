import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuth } from "@everipedia/iq-login";
import {
	ArrowRight,
	CheckCircle,
	Search,
	Target,
	TrendingUp,
	Zap,
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function DiscoveryPage() {
	const { token, address } = await getAuth();
	const isLoggedIn = Boolean(address && token);

	if (!isLoggedIn) {
		redirect("/login?from=/discovery");
	}

	return (
		<div className="p-6 bg-background space-y-6 min-h-screen">
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

				<Button className="bg-primary text-primary-foreground font-medium">
					<Search className="w-4 h-4 mr-2" />
					Scan for Properties
				</Button>
			</div>

			<Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
				<CardHeader>
					<CardTitle className="text-foreground flex items-center gap-2">
						<Zap className="w-5 h-5 text-primary" />
						Autonomous AI Investment Workflow
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-6">
						<div className="sm:col-span-1 flex flex-col items-center text-center">
							<div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center mb-2">
								<Search className="w-6 h-6 text-primary" />
							</div>
							<div className="text-sm font-medium text-foreground">
								Discover
							</div>
							<div className="text-xs text-muted-foreground">
								AI-curated properties
							</div>
						</div>

						<div className="hidden sm:flex sm:col-span-1 items-center justify-center">
							<ArrowRight className="w-5 h-5 text-primary" />
						</div>

						<div className="sm:col-span-1 flex flex-col items-center text-center">
							<div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center mb-2">
								<TrendingUp className="w-6 h-6 text-primary" />
							</div>
							<div className="text-sm font-medium text-foreground">Analyze</div>
							<div className="text-xs text-muted-foreground">
								ROI & risk modeling
							</div>
						</div>

						<div className="hidden sm:flex sm:col-span-1 items-center justify-center">
							<ArrowRight className="w-5 h-5 text-primary" />
						</div>

						<div className="sm:col-span-1 flex flex-col items-center text-center">
							<div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center mb-2">
								<Target className="w-6 h-6 text-primary" />
							</div>
							<div className="text-sm font-medium text-foreground">Propose</div>
							<div className="text-xs text-muted-foreground">
								DAO proposals & contracts
							</div>
						</div>

						<div className="hidden sm:flex sm:col-span-1 items-center justify-center">
							<ArrowRight className="w-5 h-5 text-primary" />
						</div>

						<div className="sm:col-span-1 flex flex-col items-center text-center">
							<div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center mb-2">
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
		</div>
	);
}
