import { DialogTitle } from "@/components/ui/dialog";
import { Settings } from "lucide-react";

export function SettingsHeader() {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-4">
				<div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
					<Settings className="w-5 h-5 text-primary" />
				</div>
				<div>
					<DialogTitle className="text-xl font-semibold text-foreground">
						Settings & Preferences
					</DialogTitle>
					<p className="text-sm text-muted-foreground mt-1">
						Configure your investment preferences and account settings
					</p>
				</div>
			</div>
		</div>
	);
}
