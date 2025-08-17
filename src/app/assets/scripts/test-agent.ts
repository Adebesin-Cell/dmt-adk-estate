import { createDiscoveryHubAgent } from "@/app/api/modules/agents/subagents/discovery-hub-agent/agent";

function pretty(val: unknown) {
	return typeof val === "string" ? val : JSON.stringify(val, null, 2);
}

async function run() {
	console.log("🚀 starting discovery hub quick test...");

	const { runner } = await createDiscoveryHubAgent({ isRunningTest: true });

	try {
		const res = await runner.ask(
			"Find properties in losangeles under 2500 with at least 2 bedrooms. Limit 3.",
		);
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
