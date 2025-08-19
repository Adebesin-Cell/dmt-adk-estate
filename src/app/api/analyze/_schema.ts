import z from "zod";
import { AnalysisInputSchema } from "../modules/agents/subagents/analyse-investment-agent/_schema";

export const AnalyzeBodySchema = z.object({
	propertyId: z.string().min(1),
	hints: AnalysisInputSchema.shape.hints.optional(),
});
