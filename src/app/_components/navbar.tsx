"use client";

import {
	Bot,
	Briefcase,
	Home,
	type LucideProps,
	Menu,
	Search,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	type ForwardRefExoticComponent,
	type RefAttributes,
	useState,
} from "react";
import { useAccount } from "wagmi";

import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { getCountries, getUser } from "../(home)/_actions";
import AiChatDrawer from "./ai-chat-drawer";
import { SettingsDialog } from "./settings/settings";

export function Navbar({
	countries,
	user,
}: {
	countries: Awaited<ReturnType<typeof getCountries>>["countries"];
	user: Awaited<ReturnType<typeof getUser>>;
}) {
	const pathname = usePathname();
	const from = encodeURIComponent(pathname || "/");
	const router = useRouter();
	const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
	const [openMobile, setOpenMobile] = useState(false);
	const [aiOpen, setAiOpen] = useState(false);

	const { isConnected } = useAccount();
	const isLoggedIn = isConnected;

	const navigationItems = [
		{ label: "Dashboard", icon: Home, href: "/" },
		{ label: "Investment Hub", icon: Search, href: "/discovery" },
		{ label: "Portfolio", icon: Briefcase, href: "/portfolio" },
	];

	return (
		<nav className="bg-card border-b border-border px-4 md:px-6 py-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3 md:gap-8">
					<Sheet open={openMobile} onOpenChange={setOpenMobile}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="md:hidden">
								<Menu className="w-5 h-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-80 p-0">
							<SheetHeader className="px-4 py-3">
								<SheetTitle className="flex items-center gap-2">
									<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
										<Home className="w-5 h-5 text-primary" />
									</div>
									<span className="text-foreground">REC</span>
								</SheetTitle>
							</SheetHeader>
							<Separator />
							<div className="p-3 space-y-1">
								{navigationItems.map((item) => {
									const Icon = item.icon;
									const isActive =
										item.href === "/"
											? pathname === "/"
											: pathname.startsWith(item.href);
									return (
										<Button
											key={item.href}
											variant={isActive ? "secondary" : "ghost"}
											className="w-full justify-start"
											onClick={() => {
												setOpenMobile(false);
												router.push(item.href);
											}}
										>
											<Icon className="w-4 h-4 mr-2" />
											{item.label}
										</Button>
									);
								})}
							</div>
							<Separator className="my-2" />
							<div className="p-3 flex items-center gap-2">
								<Button
									variant="outline"
									className="flex-1 bg-primary/10 border-2 border-primary/50 text-primary hover:bg-primary/20 hover:border-primary/70 shadow-lg shadow-primary/20 ring-2 ring-primary/20 transition-all duration-200 cursor-pointer"
									aria-controls="ai-advisor-drawer"
									onClick={() => {
										setAiOpen(true);
										setOpenMobile(false);
									}}
								>
									<Bot className="w-4 h-4 mr-2" />
									AI Advisor
								</Button>
							</div>
							<div className="p-3 flex items-center gap-2">
								<Button
									variant="ghost"
									className="flex-1"
									onClick={() => {
										setOpenMobile(false);
										setIsSettingModalOpen(true);
									}}
								>
									<Settings className="w-4 h-4 mr-2" />
									Settings
								</Button>
								<ConnectOrAddress
									onAfterClick={() => setOpenMobile(false)}
									openSettingsModal={() => setIsSettingModalOpen(true)}
								/>
							</div>
						</SheetContent>
					</Sheet>

					<Link href="/" className="flex items-center gap-2">
						<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
							<Home className="w-5 h-5 text-primary" />
						</div>
						<h1 className="text-lg md:text-xl font-semibold text-foreground">
							REC
						</h1>
					</Link>

					<NavLinksInline items={navigationItems} />
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						className="bg-primary/10 border-2 border-primary/50 text-primary hover:bg-primary/20 hover:border-primary/70 shadow-lg shadow-primary/20 ring-2 ring-primary/20 transition-all duration-200 cursor-pointer md:hidden"
						aria-label="AI Advisor"
						aria-controls="ai-advisor-drawer"
						onClick={() => {
							setAiOpen(true);
							setOpenMobile(false);
						}}
					>
						<Bot className="w-4 h-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="hidden md:inline-flex bg-primary/10 border-2 border-primary/50 text-primary hover:bg-primary/20 hover:border-primary/70 shadow-lg shadow-primary/20 ring-2 ring-primary/20 transition-all duration-200 cursor-pointer"
						aria-controls="ai-advisor-drawer"
						onClick={() => {
							setAiOpen(true);
							setOpenMobile(false);
						}}
					>
						<Bot className="w-4 h-4 mr-2" />
						AI Advisor
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsSettingModalOpen(true)}
						className="cursor-pointer"
						aria-label="Settings"
					>
						<Settings className="w-5 h-5" />
					</Button>
					<div className="hidden sm:flex">
						<ConnectOrAddress
							openSettingsModal={() => setIsSettingModalOpen(true)}
						/>
					</div>
					<div className="sm:hidden">
						{!isLoggedIn && (
							<Button
								size="sm"
								onClick={() => router.push(`/login?from=${from}`)}
								className="cursor-pointer"
							>
								Connect
							</Button>
						)}
					</div>
				</div>
			</div>

			{isSettingModalOpen && (
				<SettingsDialog
					open={isSettingModalOpen}
					onOpenChange={() => setIsSettingModalOpen(false)}
					countries={countries}
					user={user}
				/>
			)}
			{aiOpen && (
				<AiChatDrawer isAiChatOpen={aiOpen} setIsAiChatOpen={setAiOpen} />
			)}
		</nav>
	);
}

function NavLinksInline({
	items,
}: {
	items: {
		label: string;
		icon: ForwardRefExoticComponent<
			Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
		>;
		href: string;
	}[];
}) {
	const pathname = usePathname();
	return (
		<div className="hidden md:flex items-center gap-1">
			{items.map((item) => {
				const Icon = item.icon;
				const isActive =
					item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
				return (
					<Link key={item.href} href={item.href}>
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
								isActive
									? "bg-primary/10 text-primary border border-primary/20"
									: "text-muted-foreground hover:text-primary hover:bg-primary/5",
							)}
						>
							<Icon className="w-4 h-4" />
							<span className="hidden sm:inline">{item.label}</span>
						</Button>
					</Link>
				);
			})}
		</div>
	);
}

function ConnectOrAddress({
	onAfterClick,
	openSettingsModal,
}: {
	onAfterClick?: () => void;
	openSettingsModal?: () => void;
}) {
	const { address, isConnected } = useAccount();
	const pathname = usePathname();

	if (isConnected && address) {
		const shortAddress = `${address.slice(0, 6)}…${address.slice(-4)}`;
		return (
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					onAfterClick?.();
					openSettingsModal?.();
				}}
				className="rounded-full"
				aria-label="Open settings"
				title="Open settings"
			>
				{shortAddress}
			</Button>
		);
	}

	return (
		<Link
			href={`/login?from=${pathname}`}
			onClick={() => onAfterClick?.()}
			className={cn(
				buttonVariants({
					size: "sm",
					class: "cursor-pointer",
				}),
			)}
		>
			Connect wallet
		</Link>
	);
}
