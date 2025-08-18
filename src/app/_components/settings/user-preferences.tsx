"use client";

import {
	type getCountries,
	type getUser,
	savePreferences,
} from "@/app/(home)/_actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { Currency, Goal, RiskLevel } from "@prisma/client";
import { DollarSign, MapPin, Target, TrendingUp } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type React from "react";
import { toast } from "sonner";

type Countries = Awaited<ReturnType<typeof getCountries>>;

export type PreferencesState = {
	budget: number[];
	selectedGoals: Goal[];
	selectedLocations: string[];
	risk: RiskLevel;
};

type InvestmentGoal = {
	id: Goal;
	label: string;
	description: string;
};

type UserPreferencesProps = {
	locations: Countries["countries"];
	user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
};

export function UserPreferences({ locations, user }: UserPreferencesProps) {
	const router = useRouter();

	const pref = user.preferences;
	const initialBudgetMax =
		typeof pref?.budgetMax === "number" ? pref?.budgetMax : 300000;

	const [preferences, setPreferences] = useState<PreferencesState>({
		budget: [initialBudgetMax],
		selectedGoals: (pref?.goals as Goal[]) ?? ["CASHFLOW"],
		selectedLocations: pref?.locations?.map((x) => x.toLowerCase()) ?? [],
		risk: pref?.risk ?? "MODERATE",
	});

	const { execute, status } = useAction(savePreferences, {
		onSuccess: (res) => {
			if (res?.data?.success) {
				router.push("/discovery");
			}
		},
		onError: (e) => {
			toast.error(
				e.error.serverError ?? "Something went wrong, please try again.",
			);
		},
	});

	const saving = status === "executing";

	const toggleGoal = (goalId: Goal) => {
		setPreferences((p) => ({
			...p,
			selectedGoals: p.selectedGoals.includes(goalId)
				? p.selectedGoals.filter((id) => id !== goalId)
				: [...p.selectedGoals, goalId],
		}));
	};

	const toggleLocation = (rawId: string) => {
		const id = rawId.toLowerCase();
		setPreferences((p) => ({
			...p,
			selectedLocations: p.selectedLocations.includes(id)
				? p.selectedLocations.filter((x) => x !== id)
				: [...p.selectedLocations, id],
		}));
	};

	const goals: InvestmentGoal[] = [
		{
			id: "CASHFLOW",
			label: "Monthly Rental Income",
			description: "Steady cash flow",
		},
		{
			id: "APPRECIATION",
			label: "Long-term Appreciation",
			description: "Capital growth",
		},
		{ id: "FLIP", label: "Fix & Flip", description: "Quick returns" },
		{
			id: "CO_OWNERSHIP",
			label: "DAO Co-ownership",
			description: "Tokenized investment",
		},
	];

	const goalBadgeClasses: Record<Goal, string> = {
		CASHFLOW: "bg-green-500/10 text-green-500 border-green-500/30",
		APPRECIATION: "bg-purple-500/10 text-purple-500 border-purple-500/30",
		FLIP: "bg-orange-500/10 text-orange-500 border-orange-500/30",
		CO_OWNERSHIP: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
	};

	const startDiscovery = () => {
		const budgetMax = Math.max(0, Math.round(preferences.budget[0] ?? 0));
		execute({
			budgetMax,
			currency: (pref?.currency ?? "EUR") as Currency,
			risk: preferences.risk,
			goals: preferences.selectedGoals,
			locations: preferences.selectedLocations,
		});
	};

	return (
		<div className="space-y-6">
			<PreferencesHeader />

			<div className="space-y-6">
				<BudgetRiskCard
					budget={preferences.budget}
					risk={preferences.risk}
					onBudgetChange={(val) =>
						setPreferences((p) => ({ ...p, budget: val }))
					}
					onRiskChange={(val) => setPreferences((p) => ({ ...p, risk: val }))}
				/>

				<InvestmentGoalsCard
					goals={goals}
					selectedGoals={preferences.selectedGoals}
					onToggleGoal={toggleGoal}
				/>

				<PreferredLocationsCard
					allLocations={locations ?? []}
					selectedLocations={preferences.selectedLocations}
					onToggleLocation={toggleLocation}
				/>

				<ProfileSummaryCard
					preferences={preferences}
					goals={goals}
					goalBadgeClasses={goalBadgeClasses}
					cta={
						<Button
							className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
							onClick={startDiscovery}
							disabled={saving}
						>
							{saving ? "Starting…" : "Start AI Property Discovery"}
						</Button>
					}
				/>
			</div>
		</div>
	);
}

const PreferencesHeader = () => (
	<Card className="bg-card border-border">
		<CardHeader>
			<CardTitle className="text-foreground">Investment Preferences</CardTitle>
			<CardDescription className="text-muted-foreground">
				Configure your investment criteria for AI-powered property discovery
			</CardDescription>
		</CardHeader>
	</Card>
);

function BudgetRiskCard({
	budget,
	risk,
	onBudgetChange,
	onRiskChange,
}: {
	budget: number[];
	risk: RiskLevel;
	onBudgetChange: (val: number[]) => void;
	onRiskChange: (val: RiskLevel) => void;
}) {
	return (
		<Card className="bg-card border-border">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-foreground">
					<DollarSign className="w-5 h-5 text-primary" />
					Budget & Risk
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6 pb-6">
				<div>
					<Label className="text-foreground mb-3 block">
						Investment Budget
					</Label>
					<div className="px-3">
						<Slider
							value={budget}
							onValueChange={onBudgetChange}
							max={1_000_000}
							min={50_000}
							step={10_000}
							className="w-full"
						/>
						<div className="flex justify-between text-sm text-muted-foreground mt-2">
							<span>€50K</span>
							<span className="text-primary font-medium">
								€{budget[0].toLocaleString()}
							</span>
							<span>€1M</span>
						</div>
					</div>
				</div>

				<div>
					<Label className="text-foreground mb-3 block">Risk Tolerance</Label>
					<Select
						value={risk}
						onValueChange={(v) => onRiskChange(v as RiskLevel)}
					>
						<SelectTrigger className="bg-muted border-border text-foreground">
							<SelectValue placeholder="Select risk level" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="LOW">Low Risk - Stable markets</SelectItem>
							<SelectItem value="MODERATE">
								Moderate Risk - Balanced approach
							</SelectItem>
							<SelectItem value="HIGH">High Risk - Emerging markets</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
}

function InvestmentGoalsCard({
	goals,
	selectedGoals,
	onToggleGoal,
}: {
	goals: InvestmentGoal[];
	selectedGoals: Goal[];
	onToggleGoal: (goalId: Goal) => void;
}) {
	return (
		<Card className="bg-card border-border">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-foreground">
					<Target className="w-5 h-5 text-primary" />
					Investment Goals
				</CardTitle>
				<CardDescription className="text-muted-foreground">
					What are you looking to achieve?
				</CardDescription>
			</CardHeader>
			<CardContent className="pb-6">
				<div className="space-y-3">
					{goals.map((goal) => {
						const selected = selectedGoals.includes(goal.id);
						return (
							<Button
								key={goal.id}
								type="button"
								variant="outline"
								aria-pressed={selected}
								onClick={() => onToggleGoal(goal.id)}
								className={cn(
									"p-3 h-auto w-full justify-start cursor-pointer",
									"rounded-lg border transition-all text-left",
									"flex items-center gap-3",
									selected
										? "border-primary bg-primary/10"
										: "border-border bg-muted/30 hover:border-primary/30",
								)}
							>
								<Checkbox
									checked={selected}
									onChange={() => onToggleGoal(goal.id)}
									className="border-border pointer-events-none"
								/>
								<div className="flex-1">
									<div className="text-foreground text-sm font-medium">
										{goal.label}
									</div>
									<div className="text-muted-foreground text-xs">
										{goal.description}
									</div>
								</div>
							</Button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

function PreferredLocationsCard({
	allLocations,
	selectedLocations,
	onToggleLocation,
	pageSize = 8,
}: {
	allLocations: NonNullable<Countries["countries"]>;
	selectedLocations: string[];
	onToggleLocation: (id: string) => void;
	pageSize?: number;
}) {
	const [page, setPage] = useState(1);

	const totalPages = Math.max(1, Math.ceil(allLocations.length / pageSize));
	const start = (page - 1) * pageSize;
	const end = start + pageSize;
	const pageItems = allLocations.slice(start, end);

	return (
		<Card className="bg-card border-border">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-foreground">
					<MapPin className="w-5 h-5 text-primary" />
					Preferred Locations
				</CardTitle>
				<CardDescription className="text-muted-foreground">
					Select markets you're interested in
				</CardDescription>
			</CardHeader>

			<CardContent className="pb-6">
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
					{pageItems.map((loc) => {
						const id = loc.id.toLowerCase();
						const selected = selectedLocations.includes(id);
						return (
							<Button
								key={loc.id}
								type="button"
								variant="outline"
								aria-pressed={selected}
								data-selected={selected ?? undefined}
								onClick={() => onToggleLocation(id)}
								className={cn(
									"p-3 h-auto justify-center",
									"rounded-lg border transition-all text-center cursor-pointer border-primary/10",
									"flex flex-col items-center gap-1",
									selected
										? "!border-primary !bg-primary/10"
										: "!border-border !bg-muted/30 hover:border-primary/30",
								)}
							>
								<FlagImage urls={loc.flagUrls} alt={loc.name} className="h-6" />
								<span className="text-foreground text-sm">{loc.name}</span>
							</Button>
						);
					})}
				</div>

				{totalPages > 1 && (
					<div className="flex justify-center items-center gap-3 mt-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							Prev
						</Button>
						<span className="text-sm text-muted-foreground">
							Page <span className="text-foreground">{page}</span> of{" "}
							<span className="text-foreground">{totalPages}</span>
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
						>
							Next
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function ProfileSummaryCard({
	preferences,
	goals,
	goalBadgeClasses,
	cta,
}: {
	preferences: PreferencesState;
	goals: InvestmentGoal[];
	goalBadgeClasses: Record<Goal, string>;
	cta: React.ReactNode;
}) {
	return (
		<Card className="bg-card border-border">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-foreground">
					<TrendingUp className="w-5 h-5 text-primary" />
					Profile Summary
				</CardTitle>
			</CardHeader>
			<CardContent className="pb-6">
				<div className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Badge
							variant="secondary"
							className="bg-blue-500/10 text-blue-500 border-blue-500/30"
						>
							Budget: €{preferences.budget[0].toLocaleString()}
						</Badge>
						<Badge
							variant="secondary"
							className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
						>
							{preferences.risk === "LOW"
								? "Low"
								: preferences.risk === "HIGH"
									? "High"
									: "Moderate"}{" "}
							Risk
						</Badge>
						{preferences.selectedGoals.map((goalId) => {
							const goal = goals.find((g) => g.id === goalId);
							return (
								<Badge
									key={goalId}
									variant="secondary"
									className={
										goal
											? goalBadgeClasses[goal.id]
											: "bg-primary/10 text-primary border-primary/30"
									}
								>
									{goal?.label ?? goalId}
								</Badge>
							);
						})}
					</div>

					{cta}
				</div>
			</CardContent>
		</Card>
	);
}

function FlagImage({
	urls,
	alt,
	className,
	placeholder = "🏳",
}: {
	urls?: string[] | null;
	alt: string;
	className?: string;
	placeholder?: string;
}) {
	const [idx, setIdx] = useState(0);
	if (!urls || urls.length === 0) {
		return <div className={`text-2xl ${className}`}>{placeholder}</div>;
	}
	const src = urls[idx] ?? "";
	return src ? (
		<Image
			src={src}
			alt={alt}
			className={className}
			onError={() => setIdx((i) => i + 1)}
			loading="lazy"
			decoding="async"
			width={32}
			height={20}
		/>
	) : (
		<div className={`text-2xl ${className}`}>{placeholder}</div>
	);
}
