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

	const res = await fetch(`${base}/api/search`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: await cookieHeader(),
		},
		body: JSON.stringify({
			query:
				"Scan the market based on my preferences (budget, risk, locations, and yield).",
		}),
	});

	if (!res.ok) {
		const err = await res.text().catch(() => "");
		throw new Error(err || "Failed to start market scan");
	}

	return { ok: true, startedAt: new Date().toISOString() };
});

export const runAnalysis = authActionClient
	.schema(z.object({ propertyId: z.string().min(1) }))
	.action(async ({ parsedInput }) => {
		const base = getBaseUrl();

		const res = await fetch(`${base}/api/analyze`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: await cookieHeader(),
			},
			body: JSON.stringify({ propertyId: parsedInput.propertyId }),
		});

		if (!res.ok) {
			const err = await res.text().catch(() => "");
			throw new Error(err || "Failed to run analysis");
		}

		const data = await res.json();

		const analysisId = data.analysisId as string;

		return { ok: true, analyzedAt: new Date().toISOString(), analysisId };
	});
