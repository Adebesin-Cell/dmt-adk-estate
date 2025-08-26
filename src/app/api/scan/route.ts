import { prisma } from "@/lib/integration/prisma";
import { getAuth } from "@everipedia/iq-login";
import { type NextRequest, NextResponse } from "next/server";
import { DiscoveryOutputSchema } from "../modules/agents/subagents/discovery-hub-agent/_schema";
import { createDiscoveryHubAgent } from "../modules/agents/subagents/discovery-hub-agent/agent";
import { buildInitialState } from "../modules/build-initial-state";

export async function POST(_req: NextRequest) {
	try {
		const { address } = await getAuth();
		if (!address) {
			return NextResponse.json(
				{ success: false, error: "Authentication required" },
				{ status: 401 },
			);
		}

		const initialState = await buildInitialState(address);
		const prefs = initialState.preferences;

		const locations =
			prefs.locations && prefs.locations.length > 0
				? prefs.locations
				: ["United States"];

		const currencySymbol =
			prefs.currency === "USD" ? "$" : prefs.currency === "GBP" ? "£" : "€";

		const budgetMinStr =
			prefs.budgetMin != null
				? `${currencySymbol}${prefs.budgetMin.toLocaleString()}`
				: "No min";

		const budgetMaxStr =
			prefs.budgetMax != null
				? `${currencySymbol}${prefs.budgetMax.toLocaleString()}`
				: "No max";

		const prompt = [
			"Scan for properties based on the my preferences.",
			`Locations: ${locations.join(", ")}`,
			`Budget: ${budgetMinStr} - ${budgetMaxStr} (${prefs.currency})`,
			prefs.goals?.length
				? `Goals: ${prefs.goals.join(", ")}`
				: "Goals: (none specified)",
			`Risk level: ${prefs.risk}`,
			"If no preferred locations are set, prioritize major US metros as a fallback.",
			"Return the merged, deduplicated results across sources.",
		].join("\n");

		const { runner } = await createDiscoveryHubAgent();
		const output = await runner.ask(prompt);

		if (!output) {
			return NextResponse.json(
				{ success: false, error: "Agent produced no output" },
				{ status: 502 },
			);
		}

		const parsed = DiscoveryOutputSchema.safeParse(output);
		if (!parsed.success) {
			return NextResponse.json(
				{
					success: false,
					error: {
						message: "Agent output failed schema validation",
						issues: parsed.error.flatten(),
					},
				},
				{ status: 502 },
			);
		}

		const result = await prisma.property.createMany({
			data: parsed.data.listings.map((p) => ({
				source: p.source,
				sourceId: p.sourceId ?? null,
				url: p.url ?? null,
				address: p.address ?? null,
				city: p.city ?? null,
				country: p.country ?? null,
				lat: p.lat ?? null,
				lng: p.lng ?? null,
				priceMinor: p.priceMinor ?? null,
				currency: p.currency ?? null,
				metadata: p.metadata ?? {},
			})),
			skipDuplicates: true,
		});

		return NextResponse.json({
			success: true,
			meta: {
				usedLocations: locations,
				budgetMin: prefs.budgetMin,
				budgetMax: prefs.budgetMax,
				currency: prefs.currency,
			},
			discovery: parsed.data,
			persistence: {
				inserted: result.count,
				totalReceived: parsed.data.listings.length,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error("Scan route error:", err);
		if (err instanceof SyntaxError) {
			return NextResponse.json(
				{ success: false, error: "Invalid JSON in request body" },
				{ status: 400 },
			);
		}
		if (err instanceof Error) {
			return NextResponse.json(
				{ success: false, error: err.message },
				{ status: 500 },
			);
		}
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
