import { v } from "convex/values";
import { getProviderDataByModelId } from "../src/lib/providers";
import { internal } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const rateLimit = internalMutation({
	args: {
		userId: v.id("user"),
		modelId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) throw new Error("User not found");

		// Check if user is using their own api key, if so, don't rate limit
		const userPreferences = await ctx.runQuery(
			internal.userPreferences.getInternalUserPreferences,
			{
				userId: args.userId,
			}
		);
		if (!userPreferences) throw new Error("User preferences not found");

		if (userPreferences?.apiKeys) {
			const providerData = getProviderDataByModelId(args.modelId);
			const apiKey = userPreferences.apiKeys.find((data) => {
				return data.providerId === providerData?.id && data.key.length > 0;
			})?.key;

			if (apiKey) return;
		}

		if (
			!user.lastDailyMessageAt ||
			user.lastDailyMessageAt < Date.now() - 24 * 60 * 60 * 10
		) {
			await ctx.db.patch(args.userId, {
				remainingMessages: user?.isAnonymous ? 10 : 20,
				lastDailyMessageAt: Date.now(),
			});
		} else {
			if (user.remainingMessages && user.remainingMessages > 0) {
				await ctx.db.patch(args.userId, {
					remainingMessages: user.remainingMessages - 1,
				});
			} else {
				throw new Error("Daily message limit reached");
			}
		}
	},
});

export const remainingMessages = query({
	args: {
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session: Doc<"session"> = await ctx.runQuery(
			internal.betterAuth.getSession,
			{
				sessionToken: args.sessionToken,
			}
		);
		if (!session) throw new Error("Session not found");

		const user = await ctx.db.get(session.userId);
		if (!user) throw new Error("User not found");

		return user.remainingMessages ?? 0;
	},
});
