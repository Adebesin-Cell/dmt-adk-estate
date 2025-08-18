import { createOrchestratorAgent } from "@/app/api/modules/agents/agent";

function pretty(val: unknown) {
	return typeof val === "string" ? val : JSON.stringify(val, null, 2);
}

async function run() {
	console.log("🚀 starting orchestrator quick test...");

	const { runner } = await createOrchestratorAgent({ isRunningTest: true });

	try {
		const res = await runner.ask("Find properties in Los Angeles");

		console.log("\n--- RESPONSE ---");
		console.log(pretty(res));
	} catch (err) {
		console.error("❌ test failed:", err);
	}
}

run().catch((err) => {
	console.error("❌ test crashed:", err);
	process.exit(1);
});
