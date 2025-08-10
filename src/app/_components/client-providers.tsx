"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProgressProvider } from "@bprogress/next/app";
import { IqLoginProvider } from "@everipedia/iq-login/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

export function ClientProviders({
	children,
}: Readonly<React.PropsWithChildren>) {
	const queryClient = new QueryClient();
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			disableTransitionOnChange
			scriptProps={{ "data-cfasync": "false" }}
		>
			<TooltipProvider delayDuration={200}>
				<ProgressProvider
					height="2px"
					color="#22c55e"
					options={{ showSpinner: false }}
					shallowRouting
				>
					<IqLoginProvider projectName="DMT Estate">
						<QueryClientProvider client={queryClient}>
							{children}
						</QueryClientProvider>
					</IqLoginProvider>
				</ProgressProvider>
				<Toaster
					position="bottom-center"
					duration={3000}
					expand={true}
					richColors
				/>
			</TooltipProvider>
		</ThemeProvider>
	);
}
