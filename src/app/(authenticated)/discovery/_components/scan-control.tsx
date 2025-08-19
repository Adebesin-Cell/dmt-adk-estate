"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { startMarketScan } from "../_actions";

export function ScanControls() {
	const router = useRouter();
	const toastId = "scan-market";

	const { execute, status } = useAction(startMarketScan, {
		onExecute: () => {
			toast.loading("Scanning the market…", { id: toastId });
		},
		onSuccess: (res) => {
			const { data } = res;
			if (!data) {
				toast.error("Failed to start scan", { id: toastId });
				return;
			}
			if (data.ok) {
				toast.success("Scan started", { id: toastId });
				router.refresh();
			}
		},
		onError: (err) => {
			toast.error(
				err.error.serverError ?? "Something went wrong, please try again.",
				{ id: toastId },
			);
		},
	});

	const isExecuting = status === "executing";

	return (
		<div className="flex items-center gap-4">
			<div className="text-right">
				<div className="text-sm font-medium text-foreground mb-1">
					AI Agent Status
				</div>
				<div className="flex items-center gap-2">
					<div
						className={`w-2 h-2 rounded-full ${
							isExecuting ? "bg-amber-500" : "bg-emerald-500"
						}`}
						aria-hidden
					/>
					<span className="text-xs text-muted-foreground" aria-live="polite">
						{isExecuting ? "Executing" : "Standing by"}
					</span>
				</div>
			</div>

			<Button
				className="bg-primary text-primary-foreground font-medium"
				disabled={isExecuting}
				onClick={() => execute()}
			>
				<Search className="w-4 h-4 mr-2" />
				{isExecuting ? "Scanning..." : "Scan for Properties"}
			</Button>
		</div>
	);
}
