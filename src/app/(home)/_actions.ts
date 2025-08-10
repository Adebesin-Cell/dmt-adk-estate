"use server";

import { env } from "@/env";
import { buildFlagUrls } from "@/lib/helpers/build-flag-urls";
import axios from "axios";
import { unstable_cache } from "next/cache";
import { countryResponseSchema } from "./_schema";

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
