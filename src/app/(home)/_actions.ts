"use server";

import { env } from "@/env";
import { buildFlagUrls } from "@/lib/helpers/build-flag-urls";
import { authActionClient } from "@/lib/integration/next-safe-action";
import { prisma } from "@/lib/integration/prisma";
import { getAuth } from "@everipedia/iq-login";
import { Currency, RiskLevel } from "@prisma/client";
import axios from "axios";
import { unstable_cache } from "next/cache";
import {
	countryResponseSchema,
	preferencesSchema,
	profileSchema,
} from "./_schema";

export const getCountries = async () =>
	unstable_cache(
		async () => {
			try {
				const res = await axios.get(
					`${env.COUNTRIES_NOW_API}/countries/positions`,
				);
				const parsed = countryResponseSchema.parse(res.data);

				const countries = parsed.data.map((c) => ({
					name: c.name,
					id: c.iso2,
					flagUrls: buildFlagUrls(c.iso2),
				}));

				return { countries };
			} catch (e) {
				console.error("Error loading countries:", e);
				return { countries: [] };
			}
		},
		["countries-list-flags-simple-v1"],
		{
			revalidate: 60 * 60 * 24 * 365,
			tags: ["countries"],
		},
	)();

export const getUser = async () => {
	const { token, address } = await getAuth();

	if (!token || !address) {
		return null;
	}

	return await prisma.user.findUnique({
		where: { wallet: address.toLowerCase() },
		include: {
			savedProps: { include: { property: true } },
			proposals: { include: { property: true } },
			preferences: true,
		},
	});
};

export const updateProfileAction = authActionClient
	.schema(profileSchema)
	.action(async ({ parsedInput, ctx: { address } }) => {
		const wallet = address;
		const { firstName, lastName, email } = parsedInput;
		const name =
			[firstName, lastName].filter(Boolean).join(" ").trim() || undefined;

		const existingUser = await prisma.user.findUnique({ where: { wallet } });
		if (!existingUser) {
			throw new Error("User not found. Please connect your wallet first.");
		}

		const user = await prisma.user.update({
			where: { wallet },
			data: { name, email },
			select: { id: true, wallet: true, name: true, email: true },
		});

		return { user };
	});

export const savePreferences = authActionClient
	.schema(preferencesSchema)
	.action(async ({ ctx, parsedInput }) => {
		const user = await prisma.user.findUnique({
			where: { wallet: ctx.address },
		});

		if (!user) {
			throw new Error("User not found. Please complete onboarding.");
		}

		const prefs = await prisma.userPreference.upsert({
			where: { userId: user.id },
			create: {
				userId: user.id,
				budgetMin: parsedInput.budgetMin ?? null,
				budgetMax: parsedInput.budgetMax ?? null,
				currency: parsedInput.currency ?? Currency.EUR,
				risk: parsedInput.risk ?? RiskLevel.MODERATE,
				goals: parsedInput.goals ?? [],
				locations: parsedInput.locations ?? [],
			},
			update: {
				budgetMin: parsedInput.budgetMin ?? null,
				budgetMax: parsedInput.budgetMax ?? null,
				currency: parsedInput.currency ?? undefined,
				risk: parsedInput.risk ?? undefined,
				goals: parsedInput.goals ?? undefined,
				locations: parsedInput.locations ?? undefined,
			},
		});

		return { success: true, preferences: prefs };
	});
