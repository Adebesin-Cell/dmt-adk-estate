"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { savePropertyToUser } from "../_actions";

type AddToPortfolioProps = {
	propertyId: string;
};

export function AddToPortfolioControls({ propertyId }: AddToPortfolioProps) {
	const router = useRouter();
	const toastId = `add-to-portfolio:${propertyId}`;

	const { execute, status } = useAction(savePropertyToUser, {
		onExecute: () => {
			toast.loading("Adding to your portfolio…", { id: toastId });
		},
		onSuccess: (res) => {
			const { data } = res;
			if (!data?.ok) {
				toast.error("Failed to add property", { id: toastId });
				return;
			}
			toast.success("Added to portfolio", { id: toastId });
			router.refresh();
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
		<Button
			className="bg-primary text-primary-foreground font-medium"
			disabled={isExecuting}
			onClick={() => execute({ propertyId })}
		>
			<CheckCircle className="w-4 h-4 mr-2" />
			{isExecuting ? "Adding..." : "Add to Portfolio"}
		</Button>
	);
}
