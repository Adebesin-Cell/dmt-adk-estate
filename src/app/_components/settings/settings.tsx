"use client";

import type { getCountries, getUser } from "@/app/(home)/_actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@everipedia/iq-login/client";
import {
	Bell,
	DollarSign,
	MapPin,
	Palette,
	Settings,
	Target,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountTab } from "./account-tab";
import { AppearanceTab } from "./appearance-tab";
import { SettingsHeader } from "./settings-header";
import { UserPreferences } from "./user-preferences";

interface SettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	countries: Awaited<ReturnType<typeof getCountries>>["countries"];
	user: Awaited<ReturnType<typeof getUser>>;
}

export function SettingsDialog({
	open,
	onOpenChange,
	countries,
	user,
}: SettingsDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="dark modal-large max-h-[90vh] w-full p-0 bg-card border-border overflow-hidden">
				<DialogHeader className="p-6 border-b border-border bg-card flex-shrink-0">
					<SettingsHeader />
					<DialogDescription className="text-muted-foreground sr-only">
						Application settings and investment preferences
					</DialogDescription>
				</DialogHeader>

				<div
					className="flex-1 overflow-hidden"
					style={{ height: "calc(90vh - 140px)" }}
				>
					<Tabs defaultValue="preferences" className="h-full flex flex-col">
						<TabsList className="grid w-full grid-cols-4 bg-muted mx-6 mt-6 mb-4 flex-shrink-0 h-14">
							<TabsTrigger
								value="preferences"
								className="data-[state=active]:bg-card data-[state=active]:text-primary px-4 py-3 flex-col gap-1 h-full cursor-pointer"
							>
								<Settings className="w-5 h-5 shrink-0" />
								<span className="text-xs font-medium truncate">Investment</span>
							</TabsTrigger>
							<TabsTrigger
								value="account"
								className="data-[state=active]:bg-card data-[state=active]:text-primary px-4 py-3 flex-col gap-1 h-full cursor-pointer"
							>
								<User className="w-5 h-5 shrink-0" />
								<span className="text-xs font-medium truncate">Account</span>
							</TabsTrigger>
							<TabsTrigger
								value="notifications"
								className="data-[state=active]:bg-card data-[state=active]:text-primary px-4 py-3 flex-col gap-1 h-full cursor-pointer"
							>
								<Bell className="w-5 h-5 shrink-0" />
								<span className="text-xs font-medium truncate">
									Notifications
								</span>
							</TabsTrigger>
							<TabsTrigger
								value="appearance"
								className="data-[state=active]:bg-card data-[state=active]:text-primary px-4 py-3 flex-col gap-1 h-full cursor-pointer"
							>
								<Palette className="w-5 h-5 shrink-0" />
								<span className="text-xs font-medium truncate">Appearance</span>
							</TabsTrigger>
						</TabsList>
						<div className="flex-1 overflow-hidden">
							<TabsContent
								value="preferences"
								className="h-full data-[state=inactive]:hidden m-0"
							>
								<ScrollArea className="h-full px-6">
									<div className="py-4 pb-8">
										{user ? (
											<UserPreferences locations={countries} user={user} />
										) : (
											<InvestmentLockedView setSettingsModal={onOpenChange} />
										)}
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent
								value="account"
								className="h-full data-[state=inactive]:hidden m-0"
							>
								<ScrollArea className="h-full px-6">
									<div className="py-4 space-y-6 pb-8">
										<AccountTab closeModal={onOpenChange} />
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent
								value="notifications"
								className="h-full data-[state=inactive]:hidden m-0"
							>
								<ScrollArea className="h-full px-6">
									<div className="py-4 space-y-6 pb-8">
										{/* <NotificationsTab /> */}
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent
								value="appearance"
								className="h-full data-[state=inactive]:hidden m-0"
							>
								<ScrollArea className="h-full px-6">
									<div className="py-4 space-y-6 pb-8">
										<AppearanceTab />
									</div>
								</ScrollArea>
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function InvestmentLockedView({
	setSettingsModal,
}: { setSettingsModal: (isOpen: boolean) => void }) {
	const path = usePathname();

	return (
		<div className="grid gap-6 md:grid-cols-5">
			<Card className="md:col-span-3 relative overflow-hidden">
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="rounded-2xl p-2 bg-primary/10 text-primary ring-1 ring-primary/20">
							<Target className="w-5 h-5" />
						</div>
						<div>
							<CardTitle>Personalize your investing</CardTitle>
							<CardDescription>
								Connect your wallet to unlock tailored recommendations
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
						<li className="flex items-center gap-2">
							<DollarSign className="w-4 h-4" />
							Budget ranges & risk tuning
						</li>
						<li className="flex items-center gap-2">
							<MapPin className="w-4 h-4" />
							Country & city targeting
						</li>
						<li className="flex items-center gap-2">
							<Target className="w-4 h-4" />
							Goal-based filters
						</li>
						<li className="flex items-center gap-2">
							<Bell className="w-4 h-4" />
							Smart alerts
						</li>
					</ul>

					<div className="rounded-2xl border border-dashed p-4">
						<p className="text-sm mb-3 text-muted-foreground">
							Preview (read-only)
						</p>
						<div className="space-y-5">
							<div>
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium">Budget</span>
									<span className="text-xs text-muted-foreground">
										$300,000
									</span>
								</div>
								<Slider value={[50]} max={100} step={1} disabled />
							</div>

							<div className="flex flex-wrap gap-2">
								<Badge className="bg-green-500/10 text-green-600 border-green-500/20">
									Monthly Rental Income
								</Badge>
								<Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
									Long-term Appreciation
								</Badge>
								<Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
									Fix & Flip
								</Badge>
							</div>

							<div className="grid grid-cols-3 gap-3">
								{["Low", "Moderate", "High"].map((r) => (
									<label
										key={r}
										className={cn(
											"flex items-center gap-2 rounded-xl border p-3",
											"bg-muted/30 text-muted-foreground",
										)}
									>
										<Checkbox disabled />
										<span className="text-sm">{r}</span>
									</label>
								))}
							</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<Link
							href={`/login?from=${path}`}
							onClick={() => {
								setSettingsModal(false);
							}}
							className={cn(
								buttonVariants({
									class: "cursor-pointer",
								}),
							)}
						>
							Connect wallet
						</Link>
						<span className="text-xs text-muted-foreground">
							We never move funds. Connection verifies ownership for
							personalization.
						</span>
					</div>
				</CardContent>
			</Card>

			<Card className="md:col-span-2">
				<CardHeader>
					<CardTitle className="text-base">Why connect?</CardTitle>
					<CardDescription>Better matches, faster updates</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3 text-sm text-muted-foreground">
					<p>
						We use your on-chain identity to sync saved searches, estimate yield
						ranges, and auto-curate locations that fit your risk profile.
					</p>
					<p>
						You can disconnect anytime. No approvals or signatures required for
						viewing.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
