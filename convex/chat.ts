import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { generateObject } from "../src/lib/ai";
import { z } from "zod";
import { internal } from "./_generated/api";

export const updateChat = internalMutation({
	args: {
		chatId: v.id("chats"),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		const chat = await ctx.db.get(args.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		// Update the chat with the new title
		await ctx.db.patch(args.chatId, { title: args.title });
	},
});

export const generateTitle = internalAction({
	args: {
		chatId: v.id("chats"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		// Generate a title for the chat based on the provided content
		const data = await generateObject(
			"mistral-small",
			"You are an AI model tasked to return a title for the chat based on the messages provided. The title should be concise and relevant to the conversation. The title must be no longer than 50 characters.",
			[{ role: "user", content: args.content }],
			z.object({ title: z.string() })
		);

		// Update the chat with the generated title
		await ctx.runMutation(internal.chat.updateChat, {
			chatId: args.chatId,
			title: data.title,
		});
	},
});

export const createChat = internalMutation({
	args: {
		content: v.string(),
	},
	handler: async (ctx, args) => {
		// Create a new chat and generate a title based on the provided content
		const chatId = await ctx.db.insert("chats", {
			title: "",
		});

		// Immediately generate a title for the new chat
		await ctx.scheduler.runAfter(0, internal.chat.generateTitle, {
			chatId,
			content: args.content,
		});

		return chatId;
	},
});
