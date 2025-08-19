import { prisma } from "@/lib/integration/prisma";
import { Currency, PropertySource } from "@prisma/client";
import type { PropertyDraft } from "./agents/subagents/discovery-hub-agent/tools/_schema";

function generateSourceDetails(): {
	source: PropertySource;
	sourceId: string;
	currency: Currency;
} {
	const sources = [
		PropertySource.CRAIGSLIST,
		PropertySource.ZILLOW,
		PropertySource.RIGHTMOVE,
	];

	const currencies = [Currency.USD, Currency.EUR, Currency.GBP];

	// Randomly select source and currency
	const source = sources[Math.floor(Math.random() * sources.length)];
	const currency = currencies[Math.floor(Math.random() * currencies.length)];

	// Generate a random source ID
	const sourceId = `${source.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	return { source, sourceId, currency };
}

function extractPriceMinor(priceString: string): number | null {
	if (!priceString) return null;

	// Remove currency symbols and commas, extract numbers
	const cleanPrice = priceString.replace(/[$£€,\s]/g, "");
	const price = Number.parseFloat(cleanPrice);

	if (Number.isNaN(price)) return null;

	return Math.round(price * 100);
}

export async function extractAndPersistListings(
	orchestratorResponse: string,
	userAddress: string,
	dryRun = false,
): Promise<{ success: boolean; inserted: number; error?: string }> {
	try {
		const startMarker = "=== LISTINGS_DATA_START ===";
		const endMarker = "=== LISTINGS_DATA_END ===";

		const startIndex = orchestratorResponse.indexOf(startMarker);
		const endIndex = orchestratorResponse.indexOf(endMarker);

		if (startIndex === -1 || endIndex === -1) {
			console.log("No listings data markers found in response");
			return { success: true, inserted: 0 };
		}

		const jsonData = orchestratorResponse
			.substring(startIndex + startMarker.length, endIndex)
			.trim();

		if (!jsonData) {
			console.log("No data found between markers");
			return { success: true, inserted: 0 };
		}

		// Parse the JSON array
		let rawListings: any[];
		try {
			rawListings = JSON.parse(jsonData);
		} catch (parseError) {
			console.error("Failed to parse listings JSON:", parseError);
			return { success: false, inserted: 0, error: "Invalid JSON format" };
		}

		if (!Array.isArray(rawListings)) {
			console.error("Parsed data is not an array");
			return { success: false, inserted: 0, error: "Data is not an array" };
		}

		const propertyDrafts: PropertyDraft[] = rawListings.map((property) => {
			const sourceDetails = generateSourceDetails();

			return {
				source: sourceDetails.source,
				sourceId: sourceDetails.sourceId,
				url: property.link || property.url || null,
				address: property.address || null,
				city: property.city || null,
				country: property.country || null,
				lat: property.lat || property.latitude || null,
				lng: property.lng || property.longitude || null,
				priceMinor: extractPriceMinor(property.priceMinor),
				currency: sourceDetails.currency,
				metadata: {
					bedrooms: property.bedrooms || property.beds,
					bathrooms: property.bathrooms || property.baths,
					squareFeet: property.sqft || property.square_feet || property.size,
					propertyType: property.type || property.property_type,
					description: property.description,
					yearBuilt: property.year_built || property.built,
					lotSize: property.lot_size,
					...Object.fromEntries(
						Object.entries(property).filter(
							([key]) =>
								![
									"address",
									"city",
									"country",
									"price",
									"link",
									"url",
									"lat",
									"lng",
									"latitude",
									"longitude",
								].includes(key),
						),
					),
					discoveredBy: userAddress,
					discoveredAt: new Date().toISOString(),
				},
			};
		});

		const unique: PropertyDraft[] = [];
		const seen = new Set<string>();

		for (const property of propertyDrafts) {
			const key = property.url || `${property.address}-${property.city}`;
			if (key && seen.has(key)) continue;
			if (key) seen.add(key);
			unique.push(property);
		}

		if (dryRun) {
			console.log(`🧪 Would insert ${unique.length} unique properties`);
			return { success: true, inserted: unique.length };
		}

		const result = await prisma.property.createMany({
			data: unique,
			skipDuplicates: true,
		});

		console.log(
			`✅ Inserted ${result.count} properties for user ${userAddress}`,
		);

		return { success: true, inserted: result.count };
	} catch (error) {
		console.error("Error in extractAndPersistListings:", error);
		return {
			success: false,
			inserted: 0,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
