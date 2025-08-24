import { getAuth } from "@everipedia/iq-login";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shortenAddress } from "@/lib/helpers/shorten-address";
import Image from "next/image";

import { prisma } from "@/lib/integration/prisma";
import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	Banknote,
	Building,
	CheckCircle,
	Coins,
	CreditCard,
	DollarSign,
	ExternalLink,
	Eye,
	MapPin,
	PieChart,
	Target,
	TrendingUp,
	TrendingUp as TrendingUpIcon,
	TrendingUp as TrendingUpMini,
	Users,
	WalletIcon,
} from "lucide-react";
import { getPortfolioData } from "./_actions";

// tiny helper to read a field from property.metadata safely
function fromMeta<T = any>(meta: any, key: string, fallback: T): T {
	try {
		if (!meta) return fallback;
		if (typeof meta === "object") return (meta?.[key] ?? fallback) as T;
		const j = JSON.parse(String(meta));
		return (j?.[key] ?? fallback) as T;
	} catch {
		return fallback;
	}
}

export default async function PortfolioPage() {
	const { token, address } = await getAuth();
	if (!address || !token) redirect("/login?from=/discovery");
	const wallet = address.toLowerCase();

	// Fetch everything (user, FX snapshot, aggregates)
	const { user, prefCurrency, ratesDate, aggregates } = await getPortfolioData(
		prisma,
		wallet,
		["usd", "eur", "gbp"],
	);

	const {
		portfolioValue,
		monthlyIncome,
		totalROI,
		change24h,
		propertiesCount,
	} = aggregates;

	const fmt = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: prefCurrency,
	});

	const stats = [
		{
			label: "Total Portfolio Value",
			value: fmt.format(portfolioValue),
			change: `${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}%`,
			trend: change24h >= 0 ? "up" : "down",
			icon: DollarSign,
		},
		{
			label: "Monthly Income",
			value: fmt.format(monthlyIncome),
			change: `${change24h >= 0 ? "+" : ""}${Math.max(0, change24h / 2).toFixed(1)}%`,
			trend: change24h >= 0 ? "up" : "down",
			icon: TrendingUp,
		},
		{
			label: "Total ROI",
			value: `${totalROI.toFixed(1)}%`,
			change: "+0.0%",
			trend: totalROI >= 0 ? "up" : "down",
			icon: Target,
		},
		{
			label: "Properties",
			value: String(propertiesCount),
			change: "+0",
			trend: "up",
			icon: Building,
		},
	];

	const saved = user.savedProps ?? [];

	return (
		<div className="p-6 bg-background max-w-7xl w-full mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-semibold text-foreground">
						Investment Portfolio
					</h1>
					<p className="text-sm text-muted-foreground">
						Track and manage your real estate investments
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-border text-foreground hover:bg-primary/10 hover:border-primary/30"
					>
						<TrendingUpMini className="w-4 h-4 mr-2" />
						Portfolio Report
					</Button>
					<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
						Add Property
					</Button>
				</div>
			</div>

			<Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-foreground">
						<WalletIcon className="w-5 h-5 text-primary" />
						Portfolio Overview
					</CardTitle>
					<CardDescription className="text-muted-foreground">
						FX snapshot: {ratesDate}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-3xl font-bold text-foreground mb-1">
									{fmt.format(portfolioValue)}
								</div>
								<div className="text-sm text-muted-foreground">
									Preferred: {prefCurrency}
								</div>
							</div>
							<div className="text-right">
								<div
									className={`flex items-center gap-2 mb-1 ${change24h >= 0 ? "text-green-500" : "text-red-500"}`}
								>
									<TrendingUpIcon className="w-4 h-4" />
									<span className="text-sm font-medium">
										{change24h >= 0 ? "+" : ""}
										{change24h.toFixed(1)}%
									</span>
								</div>
								<div className="text-xs text-muted-foreground">24h change</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-card/50 p-4 rounded-lg border border-border/50">
								<div className="flex items-center gap-2 mb-2">
									<CreditCard className="w-4 h-4 text-primary" />
									<span className="text-sm font-medium text-foreground">
										Wallet Address
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm text-muted-foreground">
										{shortenAddress(address)}
									</span>
								</div>
							</div>

							<div className="bg-card/50 p-4 rounded-lg border border-border/50">
								<div className="flex items-center gap-2 mb-2">
									<Banknote className="w-4 h-4 text-primary" />
									<span className="text-sm font-medium text-foreground">
										Preferred Currency
									</span>
								</div>
								<div className="text-sm text-muted-foreground">
									{prefCurrency}
								</div>
							</div>

							<div className="bg-card/50 p-4 rounded-lg border border-border/50">
								<div className="flex items-center gap-2 mb-2">
									<Coins className="w-4 h-4 text-primary" />
									<span className="text-sm font-medium text-foreground">
										Holdings
									</span>
								</div>
								<div className="text-sm text-muted-foreground">
									{propertiesCount} Active Properties
								</div>
							</div>
						</div>

						<div className="flex gap-3">
							<Button
								size="sm"
								variant="outline"
								className="border-border hover:bg-muted"
							>
								<ExternalLink className="w-3 h-3 mr-1" />
								View on Etherscan
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="border-border hover:bg-muted"
							>
								<Activity className="w-3 h-3 mr-1" />
								Transaction History
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="border-border hover:bg-muted"
							>
								<TrendingUpMini className="w-3 h-3 mr-1" />
								Price Alerts
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Content Tabs */}
			<Tabs defaultValue="properties" className="space-y-6">
				<TabsList className="bg-muted border border-border">
					<TabsTrigger
						value="properties"
						className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
					>
						<Building className="w-4 h-4 mr-2" />
						Properties
					</TabsTrigger>
					<TabsTrigger
						value="tokenized"
						className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
					>
						<Coins className="w-4 h-4 mr-2" />
						Tokenized Assets
					</TabsTrigger>
					<TabsTrigger
						value="analytics"
						className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
					>
						<PieChart className="w-4 h-4 mr-2" />
						Analytics
					</TabsTrigger>
				</TabsList>

				<TabsContent value="properties" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{saved.length === 0 && (
							<Card className="bg-card border-border">
								<CardContent className="p-6 text-sm text-muted-foreground">
									You haven’t saved any properties yet.
								</CardContent>
							</Card>
						)}

						{saved.map(({ id, property }) => {
							const img = fromMeta<string | undefined>(
								property.metadata,
								"image",
								undefined,
							);
							const name = fromMeta<string>(
								property.metadata,
								"name",
								property.address ?? "Unnamed Property",
							);
							const location = [property.city, property.country]
								.filter(Boolean)
								.join(", ");
							const roi = fromMeta<number>(property.metadata, "roi", 0);
							const monthly = fromMeta<number>(
								property.metadata,
								"monthlyIncome",
								0,
							);
							const currentValue =
								property.priceMinor && property.currency
									? `${property.currency} ${(property.priceMinor / 100).toLocaleString()}`
									: "—";

							return (
								<Card
									key={id}
									className="bg-card border-border hover:border-primary/30 transition-all"
								>
									<CardHeader className="p-0">
										<div className="relative">
											{img ? (
												<Image
													src={
														img ??
														"https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=900&auto=format&fit=crop&q=60"
													}
													alt={name}
													width={1280}
													height={720}
													className="w-full h-48 object-cover rounded-t-lg"
												/>
											) : (
												<Image
													src="https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=900&auto=format&fit=crop&q=60"
													alt={name}
													width={1280}
													height={720}
													className="w-full h-48 object-cover rounded-t-lg"
												/>
											)}
											<div className="absolute top-3 right-3">
												<Badge
													className={`border-0 ${roi >= 10 ? "bg-green-600 text-white" : roi >= 5 ? "bg-blue-600 text-white" : "bg-gray-600 text-white"}`}
												>
													{roi}% ROI
												</Badge>
											</div>
										</div>
									</CardHeader>

									<CardContent className="p-4 space-y-4">
										<div>
											<h3 className="text-foreground font-medium mb-1">
												{name}
											</h3>
											<div className="flex items-center gap-1 text-muted-foreground text-sm">
												<MapPin className="w-3 h-3" />
												{location || "Unknown"}
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-xs text-muted-foreground">
													Current Value
												</p>
												<p className="font-medium text-foreground">
													{currentValue}
												</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">
													Monthly Income
												</p>
												<p className="font-medium text-foreground">
													{fmt.format(monthly)}
												</p>
											</div>
										</div>

										<div className="flex gap-2">
											<Button
												size="sm"
												className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
											>
												<Eye className="w-3 h-3 mr-1" />
												View Details
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</TabsContent>

				<TabsContent value="tokenized" className="space-y-6">
					<Card className="bg-card border-border">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-foreground">
								<Coins className="w-5 h-5 text-primary" />
								Tokenized Real Estate Assets
							</CardTitle>
							<CardDescription className="text-muted-foreground">
								View and manage your tokenized property investments
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{saved
								.filter((sp) =>
									fromMeta<boolean>(sp.property.metadata, "tokenized", false),
								)
								.map(({ id, property }) => {
									const name = fromMeta<string>(
										property.metadata,
										"name",
										property.address ?? "Unnamed Property",
									);
									const location = [property.city, property.country]
										.filter(Boolean)
										.join(", ");
									const stakeholders = fromMeta<number>(
										property.metadata,
										"stakeholders",
										0,
									);
									const monthly = fromMeta<number>(
										property.metadata,
										"monthlyIncome",
										0,
									);
									return (
										<div
											key={id}
											className="border border-border rounded-lg p-4 space-y-4 hover:border-primary/30 transition-all"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center">
														<Coins className="w-6 h-6 text-cyan-500" />
													</div>
													<div>
														<h4 className="text-foreground font-medium flex items-center gap-2">
															{name}
															<Badge className="bg-cyan-500/20 text-cyan-600 border-cyan-500/30 text-xs">
																Tokenized
															</Badge>
														</h4>
														<p className="text-sm text-muted-foreground">
															{location}
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="text-sm text-muted-foreground">
														Stakeholders
													</p>
													<p className="font-medium text-foreground">
														{stakeholders}
													</p>
												</div>
											</div>

											<div className="grid grid-cols-3 gap-4 text-center">
												<div>
													<p className="text-sm text-primary font-medium">
														{stakeholders}
													</p>
													<p className="text-xs text-muted-foreground">
														Stakeholders
													</p>
												</div>
												<div>
													<p className="text-sm text-primary font-medium">
														15%
													</p>
													<p className="text-xs text-muted-foreground">
														Your Share
													</p>
												</div>
												<div>
													<p className="text-sm text-primary font-medium">
														{fmt.format(Math.round(monthly * 0.15))}
													</p>
													<p className="text-xs text-muted-foreground">
														Monthly Yield
													</p>
												</div>
											</div>
										</div>
									);
								})}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card className="bg-card border-border">
							<CardHeader>
								<CardTitle className="text-foreground">
									Portfolio Performance
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Total Growth
										</span>
										<span className="text-primary font-medium">
											{totalROI >= 0 ? "+" : ""}
											{totalROI.toFixed(1)}%
										</span>
									</div>
									<Progress
										value={Math.min(100, Math.max(0, totalROI))}
										className="w-full"
									/>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-card border-border">
							<CardHeader>
								<CardTitle className="text-foreground">
									Risk Assessment
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<CheckCircle className="w-4 h-4 text-yellow-500" />
										<span className="text-sm text-foreground">
											Overall Risk: Moderate
										</span>
									</div>
									<div className="space-y-3">
										<div>
											<div className="flex justify-between text-sm mb-1">
												<span className="text-muted-foreground">
													Geographic Diversification
												</span>
												<span className="text-green-500">Good</span>
											</div>
											<Progress value={75} className="w-full" />
										</div>
										<div>
											<div className="flex justify-between text-sm mb-1">
												<span className="text-muted-foreground">
													Property Type Mix
												</span>
												<span className="text-blue-500">Moderate</span>
											</div>
											<Progress value={60} className="w-full" />
										</div>
										<div>
											<div className="flex justify-between text-sm mb-1">
												<span className="text-muted-foreground">Liquidity</span>
												<span className="text-orange-500">Low</span>
											</div>
											<Progress value={30} className="w-full" />
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{stats.map((stat) => {
					const Icon = stat.icon as any;
					return (
						<Card key={stat.label} className="bg-card border-border">
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											{stat.label}
										</p>
										<p className="text-2xl font-semibold text-foreground">
											{stat.value}
										</p>
										<div
											className={`flex items-center gap-1 mt-2 text-xs ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}
										>
											{stat.trend === "up" ? (
												<ArrowUpRight className="w-3 h-3" />
											) : (
												<ArrowDownRight className="w-3 h-3" />
											)}
											{stat.change}
										</div>
									</div>
									<div
										className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.trend === "up" ? "bg-green-500/10" : "bg-red-500/10"}`}
									>
										<Icon
											className={`w-6 h-6 ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
