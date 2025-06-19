import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	user: defineTable({
		name: v.string(),
		email: v.string(),
		emailVerified: v.boolean(),
		image: v.optional(v.string()),
		updatedAt: v.string(),
		remainingMessages: v.optional(v.number()),
		lastDailyMessageAt: v.optional(v.number()),
		isAnonymous: v.optional(v.boolean()),
	}).index("byEmail", ["email"]),
	session: defineTable({
		expiresAt: v.string(),
		token: v.string(),
		updatedAt: v.string(),
		ipAddress: v.optional(v.string()),
		userAgent: v.optional(v.string()),
		userId: v.id("user"),
	})
		.index("byToken", ["token"])
		.index("byUserId", ["userId"]),
	userPreferences: defineTable({
		userId: v.id("user"),
		chatSettings: v.optional(
			v.object({
				name: v.string(),
				occupation: v.string(),
				traits: v.array(v.string()),
				additionalInfo: v.string(),
			})
		),
		apiKeys: v.optional(
			v.array(
				v.object({
					providerId: v.string(),
					key: v.string(),
				})
			)
		),
		favoriteModels: v.array(v.string()),
	}).index("byUserId", ["userId"]),
	messages: defineTable({
		chatId: v.id("chats"),
		role: v.string(),
		content: v.string(),
		model: v.optional(v.string()),
		isComplete: v.boolean(),
		quote: v.optional(v.string()),
		images: v.array(
			v.object({
				name: v.string(),
				fileId: v.string(),
				uploadUrl: v.string(),
			})
		),
		documents: v.array(
			v.object({
				name: v.string(),
				fileId: v.string(),
				uploadUrl: v.string(),
			})
		),
		sessionId: v.string(),
		isStreaming: v.boolean(),
		cancelReason: v.optional(v.string()),
		isSearchEnabled: v.boolean(),
		sources: v.optional(
			v.array(
				v.object({
					title: v.optional(v.string()),
					url: v.string(),
				})
			)
		),
		reasoning: v.optional(
			v.object({
				isReasoning: v.boolean(),
				content: v.string(),
				startedAt: v.number(),
				endedAt: v.optional(v.number()),
			})
		),
		reasoningEffort: v.optional(
			v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
		),
		isModifiable: v.optional(v.boolean()),
	}),
	agents: defineTable({
		title: v.string(),
		description: v.string(),
		ownerId: v.id("user"),
		systemPrompt: v.string(),
	}),
	chats: defineTable({
		title: v.string(),
		branchOf: v.optional(v.id("chats")),
		isPinned: v.boolean(),
		isAnswering: v.boolean(),
		ownerId: v.id("user"),
		isShared: v.boolean(),
		agentId: v.optional(v.id("agents")),
	}).index("byOwnerId", ["ownerId"]),
});
