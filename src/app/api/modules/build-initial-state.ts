import { prisma } from "@/lib/integration/prisma";
import type { Currency, RiskLevel } from "@prisma/client";

export async function buildInitialState(address: string) {
	let user = await prisma.user.findUnique({
		where: { wallet: address },
		include: {
			preferences: true,
			savedProps: { include: { property: true } },
			proposals: { include: { token: true } },
		},
	});

	if (!user) {
		user = await prisma.user.create({
			data: { wallet: address },
			include: {
				preferences: true,
				savedProps: { include: { property: true } },
				proposals: { include: { token: true } },
			},
		});
	}

	const prefs = user.preferences;
	return {
		user: {
			wallet: address,
			id: user.id,
			email: user.email,
			name: user.name,
		},
		preferences: {
			budgetMin: prefs?.budgetMin ?? null,
			budgetMax: prefs?.budgetMax ?? null,
			currency: (prefs?.currency ?? "EUR") as Currency,
			risk: (prefs?.risk ?? "MODERATE") as RiskLevel,
			locations: prefs?.locations ?? [],
			goals: prefs?.goals ?? [],
		},
		saved_properties_count: user.savedProps.length,
		proposals_count: user.proposals.length,
		last_search: null as null | {
			location: string;
			budgetMin?: number | null;
			budgetMax?: number | null;
			bedrooms?: number | null;
			propertyType?: string | null;
		},
		interaction_history: [] as Array<{
			role: "user" | "assistant";
			text: string;
			ts: string;
		}>,
		createdAt: new Date().toISOString(),
	};
}
