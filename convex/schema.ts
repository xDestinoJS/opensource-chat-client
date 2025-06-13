import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	messages: defineTable({
		chatId: v.id("chats"),
		role: v.string(),
		content: v.string(),
		model: v.optional(v.string()),
		isComplete: v.boolean(),
		quote: v.optional(v.string()),
		sessionId: v.string(),
		isStreaming: v.boolean(),
		cancelReason: v.optional(v.string()),
	}),
	chats: defineTable({
		title: v.string(),
		branchOf: v.optional(v.id("chats")),
		isPinned: v.boolean(),
		isAnswering: v.boolean(),
	}),
});
