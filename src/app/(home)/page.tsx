import { getAuth } from "@everipedia/iq-login";
import { WelcomeScreen } from "./_components/welcome-screen";

export default async function Home() {
	const { token, address } = await getAuth();
	const isLoggedIn = Boolean(address && token);

	return isLoggedIn ? null : <WelcomeScreen />;
}
