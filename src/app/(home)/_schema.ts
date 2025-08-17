import { Currency, Goal, RiskLevel } from "@prisma/client";
import z from "zod";

const countrySchema = z.object({
	name: z.string(),
	iso2: z.string(),
});

export const countryResponseSchema = z.object({
	error: z.boolean(),
	msg: z.string(),
	data: z.array(countrySchema),
});

export const profileSchema = z.object({
	firstName: z.string().trim().max(50).optional().default(""),
	lastName: z.string().trim().max(50).optional().default(""),
	email: z.string().optional(),
	organization: z
		.string()
		.trim()
		.max(120)
		.optional()
		.or(z.literal(""))
		.transform((v) => (v ? v : undefined)),
});

export const preferencesSchema = z.object({
	budgetMin: z.number().int().min(0).nullable().optional(),
	budgetMax: z.number().int().min(0).nullable().optional(),
	currency: z.nativeEnum(Currency).optional(),
	risk: z.nativeEnum(RiskLevel).optional(),
	goals: z.array(z.nativeEnum(Goal)).max(4).optional(),
	locations: z.array(z.string().min(1)).max(10).optional(),
});
