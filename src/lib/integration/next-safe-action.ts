import { getAuth } from "@everipedia/iq-login";
import {
	DEFAULT_SERVER_ERROR_MESSAGE,
	createSafeActionClient,
} from "next-safe-action";
import { getMessageFromError } from "../helpers/get-message-from-error";

class ActionError extends Error {}

export const actionClient = createSafeActionClient({
	handleServerError(e: Error | { errors?: Record<string, string> }) {
		console.error("Action error:", getMessageFromError(e));

		if (e instanceof ActionError) {
			return e.message;
		}

		if (e instanceof Error) {
			return e.message;
		}

		return DEFAULT_SERVER_ERROR_MESSAGE;
	},
}).use(async ({ next }) => {
	const result = await next();
	return result;
});

export const authActionClient = actionClient.use(async ({ next }) => {
	const { token, address } = await getAuth();

	if (!token || !address) {
		throw new ActionError("🚨 User not authorized! Please login to proceed.");
	}

	return next({ ctx: { token, address: address.toLowerCase() } });
});
