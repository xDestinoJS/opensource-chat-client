import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// --- Helpers ---

async function getSessionFromToken(
	ctx: any,
	sessionToken: string
): Promise<Doc<"session">> {
	return await ctx.runQuery(internal.betterAuth.getSession, { sessionToken });
}

async function getOrCreateUserPreferences(
	ctx: any,
	userId: string
): Promise<Doc<"userPreferences">> {
	const existing = await ctx.db
		.query("userPreferences")
		.withIndex("byUserId", (q: any) => q.eq("userId", userId))
		.first();

	if (existing) return existing;

	const preferencesId: Id<"userPreferences"> = await ctx.runMutation(
		internal.userPreferences.createUserPreferences,
		{ userId }
	);
	const preferences = await ctx.db.get(preferencesId);
	if (!preferences) throw new Error("Failed to create user preferences.");
	return preferences;
}

// --- Internal Mutation ---

export const createUserPreferences = internalMutation({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db.insert("userPreferences", {
			userId: args.userId,
			favoriteModels: [],
		});
	},
});

// --- Public Mutation ---

export const toggleFavoriteModel = mutation({
	args: {
		sessionToken: v.string(),
		modelId: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);
		const userPreferences = await getOrCreateUserPreferences(
			ctx,
			session.userId
		);

		const isFavorite = userPreferences.favoriteModels.includes(args.modelId);
		const updatedFavorites = isFavorite
			? userPreferences.favoriteModels.filter((id) => id !== args.modelId)
			: [...userPreferences.favoriteModels, args.modelId];

		await ctx.db.patch(userPreferences._id, {
			favoriteModels: updatedFavorites,
		});
	},
});

// --- Public Query ---

export const getUserPreferences = query({
	args: { sessionToken: v.optional(v.string()) },
	handler: async (ctx, args): Promise<Doc<"userPreferences"> | null> => {
		if (!args.sessionToken) return null;
		const session = await getSessionFromToken(ctx, args.sessionToken);
		return await ctx.db
			.query("userPreferences")
			.withIndex("byUserId", (q) => q.eq("userId", session.userId))
			.first();
	},
});
