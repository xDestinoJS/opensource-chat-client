import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	messages: defineTable({
		chatId: v.id("chats"),
		role: v.string(),
		content: v.array(v.string()),
		model: v.optional(v.string()),
		isComplete: v.boolean(),
	}),
	messageCancellations: defineTable({
		messageId: v.id("messages"),
		reason: v.string(),
	}),
	chats: defineTable({
		title: v.string(),
	}),
});
