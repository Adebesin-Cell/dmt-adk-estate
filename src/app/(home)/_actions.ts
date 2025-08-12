"use server";

import { env } from "@/env";
import { buildFlagUrls } from "@/lib/helpers/build-flag-urls";
import { authActionClient } from "@/lib/integration/next-safe-action";
import { prisma } from "@/lib/integration/prisma";
import { getAuth } from "@everipedia/iq-login";
import axios from "axios";
import { unstable_cache } from "next/cache";
import { countryResponseSchema, profileSchema } from "./_schema";

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
		throw new Error("🚨 User not authorized! Please login to proceed.");
	}

	return await prisma.user.findUnique({
		where: { wallet: address.toLowerCase() },
	});
};

export const updateProfileAction = authActionClient
	.schema(profileSchema)
	.action(async ({ parsedInput, ctx: { address } }) => {
		const wallet = address.toLowerCase();
		const { firstName, lastName, email } = parsedInput;
		const name =
			[firstName, lastName].filter(Boolean).join(" ").trim() || undefined;

		const user = await prisma.user.upsert({
			where: { wallet },
			update: { name, email },
			create: { wallet, name, email },
			select: { id: true, wallet: true, name: true, email: true },
		});

		return { ok: true, user };
	});
