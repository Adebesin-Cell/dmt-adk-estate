import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		COUNTRIES_NOW_API: z.string().min(1),
	},

	// For Next.js >= 13.4.4, you only need to destructure client variables:
	experimental__runtimeEnv: {},
	emptyStringAsUndefined: true,
});
