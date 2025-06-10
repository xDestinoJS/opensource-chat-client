import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	messages: defineTable({
		chatId: v.id("chats"),
		role: v.string(),
		content: v.string(),
		model: v.optional(v.string()),
		isComplete: v.boolean(),
	}).index("by_chatId_creationTime", ["chatId", "_creationTime"]),
	chats: defineTable({
		title: v.string(),
	}),
});
