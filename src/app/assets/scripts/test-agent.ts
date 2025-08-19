function pretty(val: unknown) {
	return typeof val === "string" ? val : JSON.stringify(val, null, 2);
}

async function run() {
	console.log("🚀 starting orchestrator API test...");

	const API_URL = process.env.API_URL || "http://localhost:3000";
	const endpoint = `${API_URL}/api/search`;

	try {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie:
					"x-auth-token=eyJzaWduYXR1cmUiOiIweGZhNjRhMmE3MmVjMWRiMzNiZTk0MGNhNmQ1OTdiZTRkYTE1ZjgxNjgyZWVkYmI1NGI3N2RhMGVkNTM4NmIyMmUzZTBlZGIzZDljZTZlZmZmNzI4OTJhNzQyODRkOTNkZDQzZDJiYTYxODUxMmM0YjMzNmVlZjM0ZmUzMGI5NDBmMWMiLCJib2R5IjoiV2VsY29tZSB0byBETVQgRXN0YXRlISBDbGljayB0byBzaWduIGluIGFuZCBhY2NlcHQgdGhlIERNVCBFc3RhdGUgVGVybXMgb2YgU2VydmljZS4gVGhpcyByZXF1ZXN0IHdpbGwgbm90IHRyaWdnZXIgYSBibG9ja2NoYWluIHRyYW5zYWN0aW9uIG9yIGNvc3QgYW55IGdhcyBmZWVzLiBZb3VyIGF1dGhlbnRpY2F0aW9uIHN0YXR1cyB3aWxsIHJlc2V0IGFmdGVyIDEgeWVhci5cblxuVVJJOiBodHRwOi8vbG9jYWxob3N0OjMwMDAvbG9naW4/ZnJvbT0vXG5XZWIzIFRva2VuIFZlcnNpb246IDJcbklzc3VlZCBBdDogMjAyNS0wOC0xOFQxMjo0Njo0OC41OTdaXG5FeHBpcmF0aW9uIFRpbWU6IDIwMjYtMDgtMThUMTg6NDY6NDguNTk3WiJ9",
			},
			body: JSON.stringify({
				query: "Find properties in Los Angeles",
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error("❌ API error:", pretty(data));
			return;
		}

		console.log("\n--- API RESPONSE ---");
		console.log(pretty(data));

		if (data.success && data.response) {
			console.log("\n--- AGENT RESPONSE ---");
			console.log(pretty(data.response));
		}
	} catch (err) {
		if (err instanceof Error) {
			console.error("❌ network/fetch error:", err.message);
		} else {
			console.error("❌ unknown error:", err);
		}
	}
}

run().catch((err) => {
	console.error("❌ test crashed:", err);
	process.exit(1);
});
