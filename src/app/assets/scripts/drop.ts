// scripts/drop-tables-with-prisma.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
	await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS public.events CASCADE;");
	console.log("Dropped table public.events");

	await prisma.$executeRawUnsafe(
		"DROP TABLE IF EXISTS public.user_states CASCADE;",
	);
	console.log("Dropped table public.user_states");

	await prisma.$executeRawUnsafe(
		"DROP TABLE IF EXISTS public.app_states CASCADE;",
	);
	console.log("Dropped table public.app_states");
}

await main();
