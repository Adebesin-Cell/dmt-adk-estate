"use server";

import { prisma } from "@/lib/integration/prisma";
import { getAuth } from "@everipedia/iq-login";

export async function authenticateUser() {
	const { token, address } = await getAuth();
	if (!token || !address) {
		throw new Error("Unauthorized");
	}

	const wallet = address.toLowerCase();

	const user = await prisma.user.upsert({
		where: { wallet },
		update: {},
		create: { wallet },
		select: { id: true, wallet: true },
	});

	return { ok: true, user };
}
