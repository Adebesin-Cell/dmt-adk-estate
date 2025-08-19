import { getCurrency } from "@/lib/helpers/get-currency";
import { prisma } from "@/lib/integration/prisma";
import { getAuth } from "@everipedia/iq-login";
import { type NextRequest, NextResponse } from "next/server";
import {
	type AnalysisInput,
	AnalysisInputSchema,
	AnalysisOutputSchema,
} from "../modules/agents/subagents/analyse-investment-agent/_schema";
import { createInvestmentAnalysisAgent } from "../modules/agents/subagents/analyse-investment-agent/agent";
import { AnalyzeBodySchema } from "./_schema";

export async function POST(req: NextRequest) {
	const body = await req.json();
	const parsed = AnalyzeBodySchema.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
			{ success: false, error: parsed.error.flatten() },
			{ status: 400 },
		);
	}

	const { address } = await getAuth();

	if (!address) {
		return NextResponse.json(
			{ success: false, error: "Authentication required" },
			{ status: 401 },
		);
	}

	const { propertyId, hints } = parsed.data;

	const property = await prisma.property.findUnique({
		where: { id: propertyId },
		select: {
			id: true,
			address: true,
			city: true,
			country: true,
			url: true,
			priceMinor: true,
			currency: true,
			metadata: true,
		},
	});

	if (!property) {
		return NextResponse.json(
			{ success: false, error: "Property not found" },
			{ status: 404 },
		);
	}

	const { priceMinor, currency } = getCurrency(property);

	if (priceMinor === null || !currency) {
		return NextResponse.json(
			{ success: false, error: "Property is missing price or currency" },
			{ status: 400 },
		);
	}

	const inputCandidate = {
		property,
		hints,
		comps: undefined,
		userPreferences: undefined,
	};

	const inputParsed = AnalysisInputSchema.safeParse(inputCandidate);
	if (!inputParsed.success) {
		return NextResponse.json(
			{ success: false, error: inputParsed.error.flatten() },
			{ status: 400 },
		);
	}

	const input: AnalysisInput = inputParsed.data;

	const stringifiedInput = JSON.stringify(input, null, 6);

	const { runner } = await createInvestmentAnalysisAgent();

	const output = await runner.ask(
		`Property:\n${stringifiedInput}\n\nPlease return a complete analysis on the property.`,
	);

	if (!output) {
		return NextResponse.json(
			{ success: false, error: "Agent produced no output" },
			{ status: 502 },
		);
	}

	const outParsed = AnalysisOutputSchema.safeParse(output);
	if (!outParsed.success) {
		return NextResponse.json(
			{
				success: false,
				error: {
					message: "Agent output failed schema validation",
					issues: outParsed.error.flatten(),
				},
			},
			{ status: 502 },
		);
	}

	const saved = await prisma.analysis.create({
		data: {
			propertyId,
			data: outParsed.data,
		},
	});

	return NextResponse.json({
		success: true,
		analysisId: saved.id,
		analysis: outParsed.data,
	});
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
