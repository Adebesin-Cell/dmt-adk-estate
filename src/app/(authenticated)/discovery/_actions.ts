"use server";

import { getBaseUrl } from "@/lib/helpers/get-base-url";
import { authActionClient } from "@/lib/integration/next-safe-action";
import { cookies } from "next/headers";
import { z } from "zod";

async function cookieHeader() {
	return (await cookies()).toString();
}

export const startMarketScan = authActionClient.action(async ({ ctx }) => {
	const { address } = ctx;
	if (!address)
		throw new Error("🚨 User not authorized! Please login to proceed.");

	const base = getBaseUrl();

	try {
		const res = await fetch(`${base}/api/scan`, {
			method: "POST",
			headers: {
				Accept: "application/json",
				Cookie: await cookieHeader(),
			},
		});

		const data = await res.json().catch(() => ({}));

		if (!res.ok || data?.success === false) {
			throw new Error(data?.error || "Failed to start market scan");
		}

		return {
			ok: true,
			startedAt: new Date().toISOString(),
			scan: data,
		};
	} catch (err) {
		console.error("startMarketScan error:", err);
		throw err instanceof Error
			? err
			: new Error("Unexpected error in market scan");
	}
});

export const runAnalysis = authActionClient
	.schema(z.object({ propertyId: z.string().min(1) }))
	.action(async ({ parsedInput }) => {
		const base = getBaseUrl();

		try {
			const res = await fetch(`${base}/api/analyze`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Cookie: await cookieHeader(),
				},
				body: JSON.stringify({ propertyId: parsedInput.propertyId }),
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok || data?.success === false) {
				throw new Error(data?.error || "Failed to run analysis");
			}

			return {
				ok: true,
				analyzedAt: new Date().toISOString(),
				analysisId: data.analysisId as string,
				analysis: data.analysis,
			};
		} catch (err) {
			console.error("runAnalysis error:", err);
			throw err instanceof Error
				? err
				: new Error("Unexpected error in analysis");
		}
	});
