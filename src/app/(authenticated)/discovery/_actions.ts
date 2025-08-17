"use server";

import { authActionClient } from "@/lib/integration/next-safe-action";

export const startMarketScan = authActionClient.action(async ({ ctx }) => {
	const { address } = ctx;
	void address;
	return { ok: true, startedAt: new Date().toISOString() };
});
