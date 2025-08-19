import type { Currency } from "@prisma/client";

export const getCurrency = (property: PricedEntity) => {
	const minor =
		property.priceMinor ??
		property.metadata?.priceMinor ??
		property.metadata?.metadata?.priceMinor ??
		null;

	const currency =
		property.currency ?? (property.metadata as any)?.currency ?? "EUR";

	return { priceMinor: minor, currency };
};

type PricedEntity = {
	priceMinor?: number | null;
	currency?: Currency | null;
	metadata?: any;
};
