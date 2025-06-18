import { v } from "convex/values";
import {
	query,
	mutation,
	internalMutation,
	internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import providers, { recommendedModels } from "../src/lib/providers";

// --- Helpers ---

export async function getSessionFromToken(
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
	args: { userId: v.id("user") },
	handler: async (ctx, args) => {
		return await ctx.db.insert("userPreferences", {
			userId: args.userId,
			favoriteModels: recommendedModels,
		});
	},
});

// --- Public Mutation ---

export const toggleFavoriteModel = mutation({
	args: {
		sessionToken: v.string(),
		toggled: v.optional(v.boolean()),
		modelId: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);
		const userPreferences = await getOrCreateUserPreferences(
			ctx,
			session.userId
		);
		let updatedFavorites: string[];
		if (args.toggled !== undefined) {
			updatedFavorites = args.toggled
				? [...userPreferences.favoriteModels, args.modelId]
				: userPreferences.favoriteModels.filter((id) => id !== args.modelId);
		} else {
			const isFavorite = userPreferences.favoriteModels.includes(args.modelId);
			updatedFavorites = isFavorite
				? userPreferences.favoriteModels.filter((id) => id !== args.modelId)
				: [...userPreferences.favoriteModels, args.modelId];
		}
		await ctx.db.patch(userPreferences._id, {
			favoriteModels: updatedFavorites,
		});
	},
});

export const updateChatSettings = mutation({
	args: {
		chatSettings: v.optional(
			v.object({
				name: v.string(),
				occupation: v.string(),
				traits: v.array(v.string()),
				additionalInfo: v.string(),
			})
		),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);
		const userPreferences = await getOrCreateUserPreferences(
			ctx,
			session.userId
		);

		if (!args.chatSettings) return;

		args.chatSettings.name = args.chatSettings.name.slice(0, 50);
		args.chatSettings.occupation = args.chatSettings.occupation.slice(0, 100);

		// Modify the array so the total chars dont go over 100 and there is no trait over 50
		const newTraits = args.chatSettings.traits.filter(
			(trait: string) => trait.length < 50
		);
		if (newTraits.join("").length <= 100)
			args.chatSettings.traits = newTraits ?? [];

		args.chatSettings.additionalInfo = args.chatSettings.additionalInfo.slice(
			0,
			300
		);

		await ctx.db.patch(userPreferences._id, {
			chatSettings: args.chatSettings,
		});
	},
});

export const updateApiKeys = mutation({
	args: {
		apiKeys: v.array(
			v.object({
				providerId: v.string(),
				key: v.string(),
			})
		),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);
		const userPreferences = await getOrCreateUserPreferences(
			ctx,
			session.userId
		);

		const update: {
			providerId: string;
			key: string;
		}[] = [];

		providers.forEach((provider) => {
			const existingKey = args.apiKeys.find(
				(key) => key.providerId === provider.id
			)?.key;

			if (existingKey) {
				update.push({
					providerId: provider.id,
					key: existingKey ?? "",
				});
			}
		});

		await ctx.db.patch(userPreferences._id, {
			apiKeys: update,
		});
	},
});

export const initiateUserPreferences = mutation({
	args: { sessionToken: v.string() },
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);
		await getOrCreateUserPreferences(ctx, session.userId);
	},
});

// --- Public Query ---

export const getUserPreferences = query({
	args: { sessionToken: v.string() },
	handler: async (ctx, args): Promise<Doc<"userPreferences"> | null> => {
		const session = await getSessionFromToken(ctx, args.sessionToken);

		return await ctx.db
			.query("userPreferences")
			.withIndex("byUserId", (q) => q.eq("userId", session.userId))
			.first();
	},
});

export const getInternalUserPreferences = internalQuery({
	args: {
		userId: v.id("user"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("userPreferences")
			.withIndex("byUserId", (q) => q.eq("userId", args.userId))
			.first();
	},
});
