import { AxiosError } from "axios";

export const getMessageFromError = (e: unknown) => {
	return e instanceof AxiosError
		? e.response?.data
		: e instanceof Error
			? e.message
			: e;
};
