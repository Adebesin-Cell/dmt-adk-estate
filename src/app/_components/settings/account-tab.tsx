"use client";

import { type getUser, updateProfileAction } from "@/app/(home)/_actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Lock, Shield } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { WalletConnectCard } from "./wallet-connect-card";

type AccountUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

type AccountTabProps = {
	closeModal: (isOpen: boolean) => void;
	user: AccountUser;
};

export function AccountTab({ closeModal, user }: AccountTabProps) {
	const { first: initialFirst, last: initialLast } = splitName(user?.name);

	const { execute, status } = useAction(updateProfileAction, {
		onSuccess: () => {
			toast.success("Profile updated successfully");
			closeModal(false);
		},
		onError: (e) => {
			toast.error(e.error.serverError ?? "Failed to update profile");
		},
	});

	const saving = status === "executing";

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = new FormData(e.currentTarget);
		execute({
			firstName: form.get("firstName") as string,
			lastName: form.get("lastName") as string,
			email: form.get("email") as string,
		});
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between gap-2">
						<span className="flex items-center gap-2">Profile Information</span>
						{user?.wallet && (
							<Badge variant="secondary" className="font-mono">
								{user.wallet.slice(0, 6)}…{user.wallet.slice(-4)}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name</Label>
								<Input
									id="firstName"
									name="firstName"
									defaultValue={initialFirst}
									placeholder="Enter your first name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input
									id="lastName"
									name="lastName"
									defaultValue={initialLast}
									placeholder="Enter your last name"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email Address</Label>
							<Input
								id="email"
								name="email"
								type="email"
								defaultValue={user?.email ?? ""}
								placeholder="Enter your email"
							/>
						</div>

						<Button
							type="submit"
							className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
							disabled={saving}
						>
							{saving ? "Saving…" : "Save Changes"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="w-5 h-5 text-primary" />
						Security & Privacy
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label>Two-Factor Authentication</Label>
							<p className="text-sm text-muted-foreground">
								Add an extra layer of security to your account
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="secondary" className="bg-primary/10 text-primary">
								Enabled
							</Badge>
							<Button variant="outline" size="sm">
								Manage
							</Button>
						</div>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label>Change Password</Label>
							<p className="text-sm text-muted-foreground">
								Update your account password
							</p>
						</div>
						<Button variant="outline" size="sm">
							<Lock className="w-4 h-4 mr-2" />
							Change Password
						</Button>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label>Data Privacy</Label>
							<p className="text-sm text-muted-foreground">
								Control how your data is used
							</p>
						</div>
						<Switch defaultChecked />
					</div>
				</CardContent>
			</Card>

			<WalletConnectCard closeModal={closeModal} />
		</>
	);
}

function splitName(full?: string | null) {
	const safe = (full ?? "").trim();
	if (!safe) return { first: "", last: "" };
	const parts = safe.split(" ").filter(Boolean);
	if (parts.length === 1) return { first: parts[0], last: "" };
	return {
		first: parts.slice(0, -1).join(" "),
		last: parts.slice(-1).join(" "),
	};
}
