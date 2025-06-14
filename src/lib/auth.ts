import { betterAuth } from "better-auth";
import { convexAdapter } from "@better-auth-kit/convex";
import { ConvexHttpClient } from "convex/browser";

const convexClient = new ConvexHttpClient(
	process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export const auth = betterAuth({
	database: convexAdapter(convexClient),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	plugins: [],
});
