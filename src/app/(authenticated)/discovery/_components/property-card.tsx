import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrency } from "@/lib/helpers/get-currency";
import type { Currency, Prisma } from "@prisma/client";
import { BarChart3, Home, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { AnalyzeWithAI } from "./analyze-button";

export function PropertyCard({
	property: p,
}: { property: PropertyWithLatestAnalysis }) {
	const latest = (p.analyses?.[0]?.data ?? null) as AnalysisData | null;
	const score = latest?.score ?? latest?.aiScore;
	const yieldPct =
		latest?.yield ?? latest?.grossYield ?? latest?.netYield ?? null;
	const capRate = latest?.capRate ?? null;
	const meta = normalizeMeta(p.metadata);

	return (
		<Card className="bg-card border-border hover:border-primary/30 transition-all group hover:shadow-lg">
			<CardHeader className="p-5 pb-2">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h3 className="text-foreground font-semibold text-lg">
							{p.address ?? "Untitled Property"}
						</h3>
						<div className="flex items-center gap-2 text-muted-foreground mt-1">
							<MapPin className="w-4 h-4" />
							<span className="text-sm">
								{[p.city, p.country].filter(Boolean).join(", ") || "—"}
							</span>
						</div>
					</div>

					{typeof score === "number" && (
						<Badge
							className={`border-0 ${
								score >= 90
									? "bg-green-600 text-white"
									: score >= 80
										? "bg-blue-600 text-white"
										: score >= 70
											? "bg-yellow-600 text-white"
											: "bg-red-600 text-white"
							}`}
						>
							<Star className="w-3 h-3 mr-1" />
							{score}
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="p-5 space-y-5">
				<div className="grid grid-cols-3 gap-4">
					<div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
						<div className="text-primary font-semibold">{formatMoney(p)}</div>
						<div className="text-muted-foreground text-xs">Purchase</div>
					</div>
					<div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
						<div className="text-primary font-semibold">
							{yieldPct != null ? `${yieldPct}%` : "—"}
						</div>
						<div className="text-muted-foreground text-xs">Yield</div>
					</div>
					<div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
						<div className="text-primary font-semibold">
							{capRate != null ? `${capRate}%` : "—"}
						</div>
						<div className="text-muted-foreground text-xs">Cap Rate</div>
					</div>
				</div>

				<div className="flex items-center justify-between text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
					<div className="flex items-center gap-2">
						<Home className="w-4 h-4" />
						<span>
							{meta?.bedrooms ?? "—"} BR / {meta?.bathrooms ?? "—"} BA
						</span>
					</div>
					<div className="flex items-center gap-1">
						<span>{meta?.sqm ? `${meta.sqm} m²` : "—"}</span>
					</div>
				</div>

				<div className="flex gap-3">
					<AnalyzeWithAI propertyId={p.id} />

					{p.url ? (
						<Button
							variant="outline"
							asChild
							className="flex-1 border-border hover:bg-primary/10"
						>
							<Link href={p.url} target="_blank" rel="noreferrer">
								View Listing
							</Link>
						</Button>
					) : (
						<Button variant="outline" disabled className="flex-1">
							View Listing
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

type PropertyWithLatestAnalysis = Prisma.PropertyGetPayload<{
	include: { analyses: { orderBy: { createdAt: "desc" }; take: 1 } };
}>;

type PropertyMetadata = {
	bedrooms?: number;
	bathrooms?: number;
	sqm?: number;
	images?: string[];
	type?: string;
};

type AnalysisData = {
	score?: number;
	aiScore?: number;
	yield?: number;
	grossYield?: number;
	netYield?: number;
	capRate?: number;
};

type PricedEntity = {
	priceMinor?: number | null;
	currency?: Currency | null;
	metadata?: any;
};

function formatMoney(p: PricedEntity) {
	const { priceMinor, currency } = getCurrency(p);

	if (priceMinor === null) return "—";

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(priceMinor / 100);
}

function normalizeMeta(raw: any): PropertyMetadata {
	const m = raw ?? {};
	const d = m.metadata ?? {};

	const bedrooms =
		(typeof m.bedrooms === "number" ? m.bedrooms : undefined) ??
		(typeof d.bedrooms === "number" ? d.bedrooms : undefined) ??
		(typeof m.beds === "number" ? m.beds : undefined) ??
		(typeof d.beds === "number" ? d.beds : undefined);

	const bathrooms =
		(typeof m.bathrooms === "number" ? m.bathrooms : undefined) ??
		(typeof d.bathrooms === "number" ? d.bathrooms : undefined) ??
		(typeof m.baths === "number" ? m.baths : undefined) ??
		(typeof d.baths === "number" ? d.baths : undefined);

	// sqm direct or convert from sqft if present
	const sqmDirect =
		(typeof m.sqm === "number" ? m.sqm : undefined) ??
		(typeof d.sqm === "number" ? d.sqm : undefined);

	const sqft =
		(typeof m.sqft === "number" ? m.sqft : undefined) ??
		(typeof d.sqft === "number" ? d.sqft : undefined);

	const sqmFromSqft =
		typeof sqft === "number" ? +(sqft * 0.092903).toFixed(0) : undefined;

	return {
		bedrooms,
		bathrooms,
		sqm: sqmDirect ?? sqmFromSqft,
		images: Array.isArray(m.images)
			? m.images
			: Array.isArray(d.images)
				? d.images
				: undefined,
		type:
			typeof m.type === "string"
				? m.type
				: typeof d.type === "string"
					? d.type
					: undefined,
	};
}
