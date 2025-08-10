"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Monitor, Moon, Palette as PaletteIcon, Sun } from "lucide-react";

export function AppearanceTab() {
	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PaletteIcon className="w-5 h-5 text-primary" />
						Theme
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<div className="relative border-2 border-primary rounded-lg p-4 cursor-pointer">
								<div className="flex items-center gap-2 mb-2">
									<Moon className="w-4 h-4" />
									<span className="text-sm font-medium">Dark</span>
								</div>
								<div className="w-full h-16 bg-background border border-border rounded flex">
									<div className="w-1/3 bg-card" />
									<div className="flex-1 bg-background p-2">
										<div className="w-full h-2 bg-muted rounded mb-1" />
										<div className="w-2/3 h-2 bg-muted rounded" />
									</div>
								</div>
								<div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
									<div className="w-2 h-2 bg-primary-foreground rounded-full" />
								</div>
							</div>
						</div>

						{/* Light */}
						<div className="space-y-2">
							<div className="relative border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50">
								<div className="flex items-center gap-2 mb-2">
									<Sun className="w-4 h-4" />
									<span className="text-sm font-medium">Light</span>
								</div>
								<div className="w-full h-16 bg-white border border-gray-200 rounded flex">
									<div className="w-1/3 bg-gray-50" />
									<div className="flex-1 bg-white p-2">
										<div className="w-full h-2 bg-gray-100 rounded mb-1" />
										<div className="w-2/3 h-2 bg-gray-100 rounded" />
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<div className="relative border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50">
								<div className="flex items-center gap-2 mb-2">
									<Monitor className="w-4 h-4" />
									<span className="text-sm font-medium">System</span>
								</div>
								<div className="w-full h-16 rounded flex">
									<div className="w-1/2 bg-background border border-border flex">
										<div className="w-1/3 bg-card" />
										<div className="flex-1 bg-background p-1">
											<div className="w-full h-1 bg-muted rounded mb-1" />
											<div className="w-2/3 h-1 bg-muted rounded" />
										</div>
									</div>
									<div className="w-1/2 bg-white border border-gray-200 flex">
										<div className="w-1/3 bg-gray-50" />
										<div className="flex-1 bg-white p-1">
											<div className="w-full h-1 bg-gray-100 rounded mb-1" />
											<div className="w-2/3 h-1 bg-gray-100 rounded" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Monitor className="w-5 h-5 text-primary" />
						Display Preferences
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Data Display Density</Label>
						<Select defaultValue="comfortable">
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="compact">Compact</SelectItem>
								<SelectItem value="comfortable">Comfortable</SelectItem>
								<SelectItem value="spacious">Spacious</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label>Property Card Animations</Label>
							<p className="text-sm text-muted-foreground">
								Enable hover animations and transitions
							</p>
						</div>
						<Switch defaultChecked />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label>High Contrast Mode</Label>
							<p className="text-sm text-muted-foreground">
								Improve visibility with increased contrast
							</p>
						</div>
						<Switch />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<Label>Reduce Motion</Label>
							<p className="text-sm text-muted-foreground">
								Minimize animations for better accessibility
							</p>
						</div>
						<Switch />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PaletteIcon className="w-5 h-5 text-primary" />
						Color Customization
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Accent Color</Label>
						<div className="grid grid-cols-6 gap-2">
							<div className="w-8 h-8 bg-green-500 rounded-lg border-2 border-primary cursor-pointer" />
							<div className="w-8 h-8 bg-blue-500 rounded-lg border border-border cursor-pointer hover:border-primary/50" />
							<div className="w-8 h-8 bg-purple-500 rounded-lg border border-border cursor-pointer hover:border-primary/50" />
							<div className="w-8 h-8 bg-orange-500 rounded-lg border border-border cursor-pointer hover:border-primary/50" />
							<div className="w-8 h-8 bg-red-500 rounded-lg border border-border cursor-pointer hover:border-primary/50" />
							<div className="w-8 h-8 bg-yellow-500 rounded-lg border border-border cursor-pointer hover:border-primary/50" />
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
