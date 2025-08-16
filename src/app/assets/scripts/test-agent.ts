import { createDiscoveryHubAgent } from "@/app/api/modules/agents/agent";

async function main() {
	const { runner } = await createDiscoveryHubAgent();

	const hello = await runner.ask(
		"Hello! Can you confirm the installation is working?",
	);
	console.log(`\n--- HELLO RESPONSE ---\n${hello}\n`);

	const query = await runner.ask(
		"Find properties in losangeles under 2500 with at least 2 bedrooms. Limit 5.",
	);
	console.log(`\n--- SEARCH RESPONSE ---\n${query}\n`);
}

main().catch((err) => {
	console.error("Smoke failed:", err);
	process.exit(1);
});
