"use client";

import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@everipedia/iq-login/client";
import { motion } from "framer-motion";
import { Bot, Lock, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";

export default function AiChatDrawer({
	isAiChatOpen,
	setIsAiChatOpen,
}: {
	isAiChatOpen: boolean;
	setIsAiChatOpen: (isOpen: boolean) => void;
}) {
	const { token } = useAuth();
	const isLocked = !token;

	return (
		<Drawer
			open={isAiChatOpen}
			onOpenChange={() => setIsAiChatOpen(false)}
			direction="right"
		>
			<DrawerContent className="dark !w-[700px] !max-w-[700px] h-screen max-h-screen flex flex-col overflow-hidden border-l border-border bg-card">
				<DrawerHeader className="p-6 border-b border-border bg-card shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
								<Bot className="w-6 h-6 text-primary" />
							</div>
							<div>
								<DrawerTitle className="text-xl font-semibold text-foreground">
									AI Investment Advisor
								</DrawerTitle>
								<p className="text-sm text-muted-foreground">Chat</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-foreground hover:bg-muted"
							onClick={() => setIsAiChatOpen(false)}
						>
							<X className="w-5 h-5" />
						</Button>
					</div>
					<DrawerDescription className="text-muted-foreground sr-only">
						AI-powered real estate chat
					</DrawerDescription>
				</DrawerHeader>

				<div className="flex-1 min-h-0 overflow-hidden">
					{isLocked ? (
						<ChatLockedView />
					) : (
						<ScrollArea className="h-full px-6 py-6">
							<div className="space-y-4 pb-2">
								<div className="flex justify-start">
									<div className="max-w-[90%]">
										<div className="p-4 rounded-xl border bg-card border-border text-foreground text-sm">
											Hi! I'm your AI Real Estate Investment Advisor. Tell me
											your budget and location, and I'll help you explore
											options.
											<div className="text-xs mt-3 text-muted-foreground">
												10:30 AM
											</div>
										</div>
									</div>
								</div>

								<div className="flex justify-end">
									<div className="max-w-[90%] order-1">
										<div className="p-4 rounded-xl border bg-primary text-primary-foreground ml-6 border-primary text-sm">
											Help me invest $300K in a high-yield property in Spain.
											<div className="text-xs mt-3 text-primary-foreground/70">
												10:31 AM
											</div>
										</div>
									</div>
								</div>
							</div>
						</ScrollArea>
					)}
				</div>

				<div className="p-6 border-t border-border bg-card shrink-0">
					<div className="flex gap-3">
						<Input
							placeholder={
								isLocked
									? "Sign in to start chatting with your advisor…"
									: "Tell me about your investment goals..."
							}
							className="flex-1 bg-input border-border h-12 text-sm text-foreground placeholder:text-muted-foreground"
							disabled={isLocked}
							aria-disabled={isLocked}
						/>
						<Button
							size="sm"
							className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 font-semibold disabled:opacity-60"
							disabled={isLocked}
							title={isLocked ? "Sign in to enable chat" : "Send message"}
						>
							<Send className="w-4 h-4" />
						</Button>
					</div>

					<div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Sparkles className="w-3 h-3" />
							Try: "Help me invest $300K in a high-yield property in Spain"
						</span>
						{isLocked && (
							<span className="flex items-center gap-1">
								<Lock className="w-3 h-3" />
								Sign in to unlock AI chat
							</span>
						)}
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}

function ChatLockedView() {
	return (
		<div className="relative h-full">
			<motion.div
				aria-hidden
				className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
				animate={{ y: [0, 10, 0], opacity: [0.6, 0.9, 0.6] }}
				transition={{
					duration: 8,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
			/>
			<motion.div
				aria-hidden
				className="pointer-events-none absolute -bottom-16 -right-24 h-80 w-80 rounded-full bg-muted/40 blur-3xl"
				animate={{ y: [0, -10, 0], opacity: [0.4, 0.7, 0.4] }}
				transition={{
					duration: 10,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
			/>

			<div className="h-full flex items-center justify-center px-10">
				<div className="w-full max-w-[520px]">
					<div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-8 shadow-lg">
						<div className="flex items-center gap-4">
							<div className="w-14 h-14 rounded-2xl border border-primary/30 bg-primary/15 flex items-center justify-center">
								<Bot className="w-7 h-7 text-primary" />
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-foreground">
									Sign in to chat with your AI Advisor
								</h3>
								<p className="text-sm text-muted-foreground">
									Get tailored deal ideas, market comps, and yield analysis in
									seconds.
								</p>
							</div>
						</div>

						<div className="mt-6 space-y-3">
							<div className="flex justify-start">
								<div className="max-w-[85%]">
									<div className="p-3 rounded-xl border bg-card border-border text-sm">
										Tell me your budget, target yield, and preferred markets.
										<div className="text-[10px] mt-2 text-muted-foreground">
											AI • Preview
										</div>
									</div>
								</div>
							</div>
							<div className="flex justify-end">
								<div className="max-w-[85%] order-1">
									<div className="p-3 rounded-xl border bg-muted text-foreground ml-6 border-border text-sm">
										I’m looking for 8–10% net yield with ~€300k in Spain.
										<div className="text-[10px] mt-2 text-muted-foreground">
											You • Preview
										</div>
									</div>
								</div>
							</div>
							<div className="flex justify-start">
								<div className="max-w-[85%]">
									<div className="p-3 rounded-xl border bg-card border-dashed border-border/70 text-sm">
										I’d shortlist Seville and Valencia. Here’s why, plus 3
										properties that match.{" "}
										<span className="opacity-60">Sign in to view →</span>
									</div>
								</div>
							</div>
						</div>

						<div className="mt-6 flex flex-wrap gap-2">
							{[
								"Best city for €200k?",
								"Compare Seville vs. Valencia",
								"What is a good cap rate?",
							].map((chip) => (
								<span
									key={chip}
									className="text-xs px-3 py-1 rounded-full border border-border bg-muted/60 hover:bg-muted cursor-default"
								>
									{chip}
								</span>
							))}
						</div>

						<div className="mt-6 flex items-center gap-3">
							<Link
								href="/login"
								className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center"
							>
								<Lock className="w-4 h-4 mr-2" />
								Sign in to continue
							</Link>

							<div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
								<Sparkles className="w-3 h-3" />
								Private & secure
							</div>
						</div>
					</div>

					<p className="text-[11px] text-muted-foreground mt-3 text-center">
						You’re viewing a demo. Connect your account to unlock full
						conversations, saved chats, and personalized recommendations.
					</p>
				</div>
			</div>
		</div>
	);
}
