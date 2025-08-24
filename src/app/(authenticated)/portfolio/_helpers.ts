import { Currency, type Prisma } from "@prisma/client";

export function safeJson<T = any>(v: unknown, fallback: T): T {
	try {
		if (v == null) return fallback;
		if (typeof v === "object") return v as T;
		return JSON.parse(String(v)) as T;
	} catch {
		return fallback;
	}
}

export function extractAnalysisMetrics(data: any) {
	const d = safeJson<any>(data, {});
	const capRate = Number(
		d.capRate ?? d.cap_rate ?? d.caprate ?? d.cap ?? d.yield ?? 0,
	);
	const roi = Number(d.roiPercent ?? d.roi ?? 0);
	const estMonthlyIncome = Number(
		d.estimatedMonthlyIncome ??
			d.netMonthlyIncome ??
			d.cashflowMonthly ??
			d.rentNetMonthly ??
			d.rentGrossMonthly ??
			0,
	);
	const t24h = Number(d.change24h ?? d.delta24h ?? 0);
	return { capRate, roi, estMonthlyIncome, t24h };
}

export function average(nums: number[]) {
	if (!nums.length) return 0;
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export type UserWithPortfolio = Prisma.UserGetPayload<{
	include: {
		preferences: true;
		savedProps: { include: { property: { include: { analyses: true } } } };
		proposals: {
			include: { property: { include: { analyses: true } }; token: true };
		};
	};
}>;

export interface Aggregates {
	portfolioValue: number;
	monthlyIncome: number;
	totalROI: number;
	change24h: number;
	propertiesCount: number;
}

export function pickRatesFor(
	allRates: Record<string, number>,
	codes: string[],
) {
	const picked: Record<string, number> = { gbp: 1 };
	for (const raw of Array.from(new Set(codes.map((c) => c.toLowerCase())))) {
		if (raw === "gbp") continue;
		const v = allRates[raw];
		if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
			throw new Error(`Missing FX rate for ${raw}`);
		}
		picked[raw] = v;
	}
	return picked;
}

export async function computeAggregates(
	user: UserWithPortfolio,
	rates: Record<string, number>,
) {
	const prefCurrency: Currency = user.preferences?.currency ?? Currency.EUR;

	const activeProposals = (user.proposals ?? []).filter(
		(p) => p.status !== "DRAFT",
	);
	const executed = activeProposals.filter(
		(p) => p.status?.toUpperCase() === "EXECUTED",
	);
	const saved = user.savedProps ?? [];

	function convertMinor(amountMinor: number, from: Currency, to: Currency) {
		const fromCode = from.toLowerCase();
		const toCode = to.toLowerCase();
		if (fromCode === toCode) return amountMinor / 100;

		const rFrom = rates[fromCode];
		const rTo = rates[toCode];
		if (!rFrom || !rTo) return 0;

		const gbpAmount =
			fromCode === "gbp" ? amountMinor / 100 : amountMinor / 100 / rFrom;
		return toCode === "gbp" ? gbpAmount : gbpAmount * rTo;
	}

	const portfolioValue = executed.reduce((sum, pr) => {
		const priceMinor = pr.property.priceMinor ?? 0;
		const cur = pr.property.currency ?? prefCurrency;
		return sum + convertMinor(priceMinor, cur, prefCurrency);
	}, 0);

	const monthlyIncome = executed.reduce((sum, pr) => {
		const metrics =
			pr.property.analyses?.map((a) => extractAnalysisMetrics(a.data)) ?? [];
		const best = metrics.find((m) => m.estMonthlyIncome) ?? metrics[0];
		return sum + (best?.estMonthlyIncome ?? 0);
	}, 0);

	const roiSamples: number[] = [];
	for (const pr of executed) {
		const mets =
			pr.property.analyses?.map((a) => extractAnalysisMetrics(a.data)) ?? [];
		for (const m of mets) {
			if (m.roi) roiSamples.push(m.roi);
			else if (m.capRate) roiSamples.push(m.capRate);
		}
	}
	const totalROI = average(roiSamples);

	const changeSamples: number[] = [];
	for (const pr of executed) {
		const mets =
			pr.property.analyses?.map((a) => extractAnalysisMetrics(a.data)) ?? [];
		for (const m of mets) {
			if (Number.isFinite(m.t24h) && m.t24h !== 0) changeSamples.push(m.t24h);
		}
	}
	const change24h = changeSamples.length ? average(changeSamples) : 0;

	const propertiesCount =
		executed.length || activeProposals.length || saved.length;

	return {
		portfolioValue,
		monthlyIncome,
		totalROI,
		change24h,
		propertiesCount,
	} satisfies Aggregates;
}
