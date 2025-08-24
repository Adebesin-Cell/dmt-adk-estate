"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { BarChart3, Coins, Search } from "lucide-react";
import Link from "next/link";

type DashboardProps = {
	user: Prisma.UserGetPayload<{
		include: {
			savedProps: { include: { property: true } };
			proposals: { include: { property: true } };
			preferences: true;
		};
	}>;
};

export function Dashboard({ user }: DashboardProps) {
	const savedProps = user?.savedProps ?? [];
	const proposals = user?.proposals ?? [];
	const regionLabel = regionLabelFromUser(user);

	const currency =
		savedProps.find((s) => s.property?.currency)?.property?.currency ?? "EUR";
	const portfolioTotalMinor = savedProps.reduce((sum, s) => {
		const p = s.property;
		return sum + (p?.priceMinor ?? 0);
	}, 0);

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="bg-card border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-foreground">
							Property Discovery
						</CardTitle>
						<Search className="w-5 h-5 text-primary" />
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						AI-curated leads across {regionLabel} markets with yield, cap rate,
						and comps.
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
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-foreground">My Portfolio</CardTitle>
					{savedProps.length > 0 && (
						<Badge
							variant="secondary"
							className="bg-primary/10 text-primary border-primary/20"
						>
							{savedProps.length} properties
						</Badge>
					)}
				</CardHeader>
				<CardContent>
					{savedProps.length === 0 ? (
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
								Save a property to start building your portfolio.
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
						<div className="space-y-5">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<Card className="bg-muted/30 border-border">
									<CardContent className="p-4">
										<p className="text-xs text-muted-foreground">
											Estimated Value
										</p>
										<p className="text-xl font-semibold">
											{formatMoney(portfolioTotalMinor, currency)}
										</p>
									</CardContent>
								</Card>
								<Card className="bg-muted/30 border-border">
									<CardContent className="p-4">
										<p className="text-xs text-muted-foreground">
											Saved Properties
										</p>
										<p className="text-xl font-semibold">{savedProps.length}</p>
									</CardContent>
								</Card>
								<Card className="bg-muted/30 border-border">
									<CardContent className="p-4">
										<p className="text-xs text-muted-foreground">
											Primary Currency
										</p>
										<p className="text-xl font-semibold">{currency}</p>
									</CardContent>
								</Card>
							</div>

							<ul className="space-y-3">
								{savedProps.map((sp) => {
									const p = sp.property;
									return (
										<li
											key={sp.id}
											className="p-3 border border-border rounded-lg flex items-center justify-between bg-muted/30"
										>
											<div>
												<h4 className="font-medium text-foreground">
													{p?.address ?? p?.city ?? "Untitled Property"}
												</h4>
												<p className="text-xs text-muted-foreground">
													{[p?.city, p?.country].filter(Boolean).join(", ")}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="secondary" className="text-xs">
													{p?.currency ?? "EUR"}
												</Badge>
												<span className="text-sm font-medium">
													{formatMoney(p?.priceMinor, p?.currency ?? "EUR")}
												</span>
											</div>
										</li>
									);
								})}
							</ul>
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="bg-card border-border">
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
				<CardContent>
					{proposals.length === 0 ? (
						<div className="text-center py-10 space-y-3">
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
						<ul className="space-y-3">
							{proposals.map((p) => (
								<li
									key={p.id}
									className="p-3 border border-border rounded-lg bg-muted/30"
								>
									<div className="flex items-start justify-between">
										<div>
											<h4 className="font-medium text-foreground">{p.title}</h4>
											<p className="text-xs text-muted-foreground">
												{p.property?.address
													? `Related: ${p.property.address}`
													: "Standalone proposal"}
											</p>
										</div>
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
											)}
										>
											{p.status}
										</Badge>
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function formatMoney(
	minor: number | null | undefined,
	currency: string | null | undefined = "EUR",
) {
	if (!minor || minor <= 0) return "—";
	const value = minor / 100;
	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: currency || "EUR",
			maximumFractionDigits: 0,
		}).format(value);
	} catch {
		return `${value.toLocaleString()} ${currency ?? ""}`;
	}
}

function regionLabelFromUser(
	user: Prisma.UserGetPayload<{
		include: {
			savedProps: { include: { property: true } };
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
