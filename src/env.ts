import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		COUNTRIES_NOW_API: z.string().min(1),
		DATABASE_URL: z.string().min(1),
		LLM_MODEL: z.string(),
	},

	client: {
		NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID: z.string().min(1),
		NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().min(1),
		NEXT_PUBLIC_CHAIN_ID: z.string().min(1),
	},

	// For Next.js >= 13.4.4, you only need to destructure client variables:
	experimental__runtimeEnv: {
		NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID:
			process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID,
		NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
			process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
		NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
	},
	emptyStringAsUndefined: true,
});
