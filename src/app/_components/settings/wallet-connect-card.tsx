"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@everipedia/iq-login/client";
import { Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainnet } from "viem/chains";
import {
	useAccount,
	useBalance,
	useChainId,
	useEnsName,
	useSwitchChain,
} from "wagmi";

export function WalletConnectCard({
	closeModal,
}: { closeModal: (isOpen: boolean) => void }) {
	const pathname = usePathname();
	const { logout } = useAuth();
	const { address, chain, isConnected } = useAccount();
	const { chains, switchChain, isPending: isSwitching } = useSwitchChain();
	const chainId = useChainId();

	const { data: ensName } = useEnsName({
		address,
		chainId: mainnet.id,
		query: { enabled: !!address },
	});
	const { data: balance } = useBalance({
		address,
		query: { enabled: !!address },
	});

	const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
	const isUnsupported = !!chainId && !chains.some((c) => c.id === chainId);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Globe className="w-5 h-5 text-primary" />
					Wallet
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{isConnected ? (
					<>
						<div className="flex items-center justify-between p-3 border border-border rounded-lg">
							<div>
								<div className="font-medium">{ensName ?? short(address)}</div>
								<div className="text-sm text-muted-foreground">
									{chain?.name ?? "Unknown network"}{" "}
									{isUnsupported ? "(unsupported)" : ""}
								</div>
								{balance?.formatted && (
									<div className="text-sm text-muted-foreground">
										Balance: {Number(balance.formatted).toFixed(4)}{" "}
										{balance.symbol ?? ""}
									</div>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Badge className="bg-primary/10 text-primary">Connected</Badge>
								<Button variant="outline" size="sm" onClick={logout}>
									Disconnect
								</Button>
							</div>
						</div>

						{chains.length > 1 && (
							<div className="flex flex-wrap gap-2">
								{chains.map((c) => (
									<Button
										key={c.id}
										size="sm"
										variant={c.id === chainId ? "default" : "outline"}
										onClick={() => switchChain({ chainId: c.id })}
										disabled={isSwitching || c.id === chainId}
									>
										{c.name}
									</Button>
								))}
							</div>
						)}
					</>
				) : (
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">
							Connect your wallet to view account details.
						</p>
						<Link
							href={`/login?from=${pathname}`}
							onClick={() => {
								closeModal(false);
							}}
							className={cn(
								buttonVariants({
									class: "cursor-pointer",
								}),
							)}
						>
							Connect wallet
						</Link>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
