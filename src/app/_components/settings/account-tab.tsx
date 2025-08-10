import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Lock, Shield } from "lucide-react";
import { WalletConnectCard } from "./wallet-connect-card";

export function AccountTab({
	closeModal,
}: { closeModal: (isOpen: boolean) => void }) {
	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Profile Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input id="firstName" placeholder="Enter your first name" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input id="lastName" placeholder="Enter your last name" />
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email Address</Label>
						<Input id="email" type="email" placeholder="Enter your email" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="organization">Organization</Label>
						<Input id="organization" placeholder="Your organization or DAO" />
					</div>
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
