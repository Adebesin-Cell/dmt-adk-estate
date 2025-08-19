"use server";

import { authActionClient } from "@/lib/integration/next-safe-action";
import { prisma } from "@/lib/integration/prisma";
import { z } from "zod";

export const savePropertyToUser = authActionClient
	.schema(
		z.object({
			propertyId: z.string().min(1, "Property ID is required"),
		}),
	)
	.action(async ({ ctx, parsedInput }) => {
		const { address } = ctx;
		if (!address) {
			throw new Error("🚨 User not authorized! Please login to proceed.");
		}

		const user = await prisma.user.findUnique({
			where: { wallet: address },
			select: { id: true },
		});

		if (!user) {
			throw new Error("User not found");
		}

		const saved = await prisma.savedProperty.create({
			data: {
				userId: user.id,
				propertyId: parsedInput.propertyId,
			},
			include: {
				property: true,
			},
		});

		return { ok: true, saved };
	});
