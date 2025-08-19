"use client";

import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { runAnalysis } from "../_actions";

export function AnalyzeWithAI({ propertyId }: { propertyId: string }) {
	const router = useRouter();
	const toastId = `analyze-${propertyId}`;

	const { execute, status } = useAction(runAnalysis, {
		onExecute: () => toast.loading("Running AI analysis…", { id: toastId }),
		onSuccess: (res) => {
			const { data } = res;
			if (!data || !data.ok) {
				toast.error("Analysis failed", { id: toastId });
				return;
			}
			toast.success("Analysis complete", { id: toastId });
			router.push(`/analysis/${propertyId}`);
		},
		onError: (err) => {
			toast.error(err.error.serverError ?? "Something went wrong.", {
				id: toastId,
			});
		},
	});

	const isExecuting = status === "executing";

	return (
		<Button
			onClick={() => execute({ propertyId })}
			disabled={isExecuting}
			className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
		>
			<BarChart3 className="w-4 h-4 mr-2" />
			{isExecuting ? "Analyzing…" : "Analyze with AI"}
		</Button>
	);
}
