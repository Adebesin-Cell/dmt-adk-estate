import { prisma } from "@/lib/integration/prisma";
import { getAuth } from "@everipedia/iq-login";
import { Dashboard } from "./_components/dashboard";
import { WelcomeScreen } from "./_components/welcome-screen";

export default async function DashboardPage() {
	const { token, address } = await getAuth();

	if (!address || !token) return <WelcomeScreen />;

	const user = await prisma.user.findUnique({
		where: { wallet: address },
		include: {
			savedProps: { include: { property: true } },
			proposals: { include: { property: true } },
			preferences: true,
		},
	});

	if (!user) return <WelcomeScreen />;

	return <Dashboard user={user} />;
}
