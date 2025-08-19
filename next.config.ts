import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "flagcdn.com",
			},
			{
				protocol: "https",
				hostname: "purecatamphetamine.github.io",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
	},
};

export default nextConfig;
