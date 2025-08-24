"use server";

import { Currency, type PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { computeAggregates, pickRatesFor } from "./_helpers";
import { exchangeRateSchema } from "./_schema";

export const getAllRates = unstable_cache(
	async () => {
		const res = await fetch(
			"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/gbp.json",
			{ next: { revalidate: 3600 } },
		);
		if (!res.ok) throw new Error("Failed to fetch exchange rates");

		const json = await res.json();
		const parsed = exchangeRateSchema.safeParse(json);
		if (!parsed.success) {
			throw new Error("Failed to parse exchange rates");
		}

		const { date, gbp } = parsed.data;
		gbp.gbp = 1;

		return { date, rates: gbp };
	},
	["fx-all-rates"],
	{ revalidate: 3600 },
);

export async function getUserWithPortfolio(
	prisma: PrismaClient,
	walletLower: string,
) {
	return prisma.user.findUnique({
		where: { wallet: walletLower },
		include: {
			preferences: true,
			savedProps: { include: { property: { include: { analyses: true } } } },
			proposals: {
				include: { property: { include: { analyses: true } }, token: true },
			},
		},
	});
}

export async function getPortfolioData(
	prisma: PrismaClient,
	walletLower: string,
	neededCodes: string[] = ["usd", "eur", "gbp"],
) {
	const user = await getUserWithPortfolio(prisma, walletLower);
	if (!user) throw new Error("User not found");

	const prefCurrency: Currency = user.preferences?.currency ?? Currency.EUR;

	const { date: ratesDate, rates: allRates } = await getAllRates();

	const rates = pickRatesFor(
		allRates,
		Array.from(new Set([prefCurrency.toLowerCase(), ...neededCodes])),
	);

	const aggregates = await computeAggregates(user, rates);

	return { user, prefCurrency, ratesDate, rates, aggregates };
}
