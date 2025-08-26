import { getAuth } from "@everipedia/iq-login";
import { type NextRequest, NextResponse } from "next/server";
import { createOrchestratorAgent } from "../modules/agents/agent";
import { requestSchema } from "./_schema";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const parseResult = requestSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Invalid request data",
					details: parseResult.error.errors.map((err) => ({
						field: err.path.join("."),
						message: err.message,
					})),
					timestamp: new Date().toISOString(),
				},
				{ status: 400 },
			);
		}

		const { query } = parseResult.data;

		const { address } = await getAuth();

		if (!address) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const { runner } = await createOrchestratorAgent();

		const response = await runner.ask(query);

		return NextResponse.json({
			response,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Orchestrator agent error:", error);

		if (error instanceof SyntaxError) {
			return NextResponse.json(
				{
					error: "Invalid JSON in request body",
					message: error.message,
					timestamp: new Date().toISOString(),
				},
				{ status: 400 },
			);
		}

		if (error instanceof Error) {
			return NextResponse.json(
				{
					error: "Agent processing failed",
					message: error.message,
					timestamp: new Date().toISOString(),
				},
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				error: "Internal server error",
				timestamp: new Date().toISOString(),
			},
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
