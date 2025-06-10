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
		content: v.optional(v.string()),
		messages: v.optional(v.array(v.id("messages"))),
	},
	handler: async (ctx, args) => {
		// Create a new chat and generate a title based on the provided content
		const chatId = await ctx.db.insert("chats", {
			title: "",
		});

		// If it's a new chat, we can generate a title based on the content
		if (args.content) {
			await ctx.scheduler.runAfter(0, internal.chat.generateTitle, {
				chatId,
				content: args.content,
			});
		}

		return chatId;
	},
});

export const branchChat = internalMutation({
	args: {
		messageId: v.id("messages"),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("[DB] Message not found.");
		}

		const chat = await ctx.db.get(message.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: chat._id,
		});
		const index = messages.findIndex((msg) => msg._id === args.messageId);
		const messagesToKeep = messages.slice(0, index + 1);

		// Create a new chat with the same messages but a different title
		const newChatId = await ctx.db.insert("chats", {
			title: args.title,
		});

		// Insert the messages into the new chat
		for (const message of messagesToKeep) {
			await ctx.db.insert("messages", {
				chatId: newChatId,
				role: message.role,
				content: message.content,
				model: message.model,
				isComplete: message.isComplete,
			});
		}

		return newChatId;
	},
});
