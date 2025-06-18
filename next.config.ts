import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		domains: ["lh3.googleusercontent.com"],
	},
	experimental: {
		serverActions: {
			allowedOrigins: ["localhost:3000"],
		},
	},
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
	typescript: {
		// !! WARN !!
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		// !! WARN !!
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
