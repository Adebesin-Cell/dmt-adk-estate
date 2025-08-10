"use client";

import { Login } from "@everipedia/iq-login/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";

function LoginPage() {
	const searchParams = useSearchParams();
	const from = searchParams.get("from");
	const router = useRouter();
	const [, startTransition] = useTransition();
	const isProcessingRef = useRef(false);

	const handleLoginRedirect = async () => {
		if (isProcessingRef.current) {
			console.log("ℹ️ Login already in progress, ignoring duplicate call");
			return;
		}

		isProcessingRef.current = true;
		const loadingToast = toast.loading("Logging in...");

		try {
			startTransition(() => {
				router.push(from || "/");
			});

			toast.success("Login successful", {
				id: loadingToast,
			});
		} catch (error) {
			console.error("🚨 Login error:", error);
			toast.error("Failed to login. Please try again.", {
				id: loadingToast,
			});
		} finally {
			setTimeout(() => {
				isProcessingRef.current = false;
			}, 1000);
		}
	};

	return (
		<div className="flex items-center justify-center py-10 p-6">
			<Login
				title="Sign In / Connect"
				description="Connect your wallet to access your account"
				connectText="Step 1: Connect your wallet"
				signTokenText="Step 2: Authenticate your wallet"
				handleRedirect={handleLoginRedirect}
			/>
		</div>
	);
}

export default LoginPage;
