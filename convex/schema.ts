import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	messages: defineTable({
		chatId: v.id("chats"),
		role: v.string(),
		content: v.string(),
		model: v.optional(v.string()),
		isComplete: v.boolean(),
	}),
	chats: defineTable({
		title: v.string(),
	}),
});
