"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { startMarketScan } from "../_actions";

export function ScanControls() {
	const [status, setStatus] = useState<"standby" | "executing">("standby");

	const { execute, status: execStatus } = useAction(startMarketScan, {
		onExecute: () => setStatus("executing"),
		onSuccess: () => {},
		onError: () => setStatus("standby"),
	});

	const disabled = execStatus === "executing" || status === "executing";

	return (
		<div className="flex items-center gap-4">
			<div className="text-right">
				<div className="text-sm font-medium text-foreground mb-1">
					AI Agent Status
				</div>
				<div className="flex items-center gap-2">
					<div
						className={`w-2 h-2 rounded-full ${
							status === "executing" ? "bg-amber-500" : "bg-emerald-500"
						}`}
					/>
					<span className="text-xs text-muted-foreground">
						{status === "executing" ? "Executing" : "Standing by"}
					</span>
				</div>
			</div>

			<Button
				className="bg-primary text-primary-foreground font-medium"
				disabled={disabled}
				onClick={() => execute()}
			>
				<Search className="w-4 h-4 mr-2" />
				{status === "executing" ? "Scanning..." : "Scan for Properties"}
			</Button>
		</div>
	);
}
