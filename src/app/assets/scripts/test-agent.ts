import "dotenv/config";
import { createDiscoveryHubAgent } from "@/app/api/modules/agents/subagents/discovery-hub-agent/agent";

function pretty(val: unknown) {
	return typeof val === "string" ? val : JSON.stringify(val, null, 2);
}

async function time<T>(label: string, fn: () => Promise<T>) {
	const t0 = Date.now();
	const res = await fn();
	const ms = Date.now() - t0;
	console.log(`⏱️  ${label} took ${ms}ms`);
	return res;
}

type Q = { label: string; q: string };

const QUESTIONS: Q[] = [
	{ label: "hello", q: "Hello! Can you confirm the installation is working?" },
	{
		label: "losangeles",
		q: "Find properties in losangeles under 2500 with at least 2 bedrooms. Limit 5.",
	},
	{
		label: "london",
		q: "Find properties in london under 750000 with at least 2 bedrooms. Limit 3.",
	},
	{
		label: "paris-lisbon",
		q: "Search for properties in paris and lisbon under 600000 with 3+ bedrooms. Limit 4.",
	},
	{
		label: "no-region",
		q: "Find properties under 500k with at least 2 bedrooms.",
	},
	{
		label: "luxury-nyc",
		q: "Show me luxury apartments in new york city above 2 million USD with at least 3 bedrooms. Limit 2.",
	},
	{
		label: "spain",
		q: "Any villas for sale in Spain under €800k? Limit 3.",
	},
	{
		label: "rentals-berlin",
		q: "Find rental apartments in berlin under 1500 with 2 bedrooms.",
	},
	{
		label: "cheap-la",
		q: "Show me cheapest listings in losangeles under 1000 USD. Limit 5.",
	},
	{
		label: "unknown-region",
		q: "Find properties in mars colony under 500000. Limit 2.",
	},
];

function parseArgs() {
	const flags = new Set<string>();
	const labels: string[] = [];
	for (const arg of process.argv.slice(2)) {
		if (arg.startsWith("--")) flags.add(arg.toLowerCase());
		else labels.push(arg.toLowerCase());
	}
	return {
		dryRun: !flags.has("--write"),
		labels,
	};
}

async function run() {
	const { dryRun, labels } = parseArgs();

	console.log("🚀 starting discovery hub battery...");
	console.log(
		dryRun ? "🧪 mode: DRY RUN (no DB writes)\n" : "🟢 mode: REAL WRITES\n",
	);

	const { runner } = await time("createDiscoveryHubAgent", () =>
		createDiscoveryHubAgent({ isRunningTest: dryRun }),
	);

	const only = new Set(labels);

	let ok = 0;
	for (const { label, q } of QUESTIONS) {
		if (only.size && !only.has(label.toLowerCase())) continue;

		try {
			const res = await time(label, () => runner.ask(q));
			const line = `\n--- ${label.toUpperCase()} RESPONSE ---`;
			console.log(line);
			console.log(pretty(res));
			console.log("-".repeat(line.length));
			ok++;
		} catch (err) {
			console.error(`❌ ${label} failed:`, err);
		}
	}

	console.log(
		`\n✅ battery complete • ${ok}/${only.size || QUESTIONS.length} succeeded`,
	);
}

run().catch((err) => {
	console.error("❌ battery crashed:", err);
	process.exit(1);
});
