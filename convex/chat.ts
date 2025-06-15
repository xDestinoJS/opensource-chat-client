import { v } from "convex/values";
import {
	internalAction,
	internalMutation,
	mutation,
	query,
} from "./_generated/server";
import { generateObject } from "../src/lib/ai";
import { z } from "zod";
import { internal } from "./_generated/api";
import { ModelId } from "../src/lib/providers";

export const getChat = query({
	args: {
		chatId: v.id("chats"),
	},
	handler: async (ctx, args) => {
		// Fetch the chat by ID
		const chat = await ctx.db.get(args.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		return chat;
	},
});

export const listChats = query({
	handler: async (ctx) => {
		return await ctx.db
			.query("chats")
			.withIndex("by_creation_time")
			.order("desc")
			.collect();
	},
});

export const updateChat = internalMutation({
	args: {
		chatId: v.id("chats"),
		title: v.optional(v.string()),
		isAnswering: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const chat = await ctx.db.get(args.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		const updates: any = {};
		if (args.title !== undefined)
			updates.title = args.title != null ? args.title : undefined;
		if (args.isAnswering !== undefined)
			updates.isAnswering =
				args.isAnswering != null ? args.isAnswering : undefined;

		// Update the chat with the new title
		await ctx.db.patch(args.chatId, updates);
	},
});

export const updateChatData = mutation({
	args: {
		id: v.id("chats"),
		title: v.optional(v.string()),
		isPinned: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		if (args.title != undefined && args.title.trim() === "") {
			throw new Error("Title cannot be empty.");
		}

		const updates: { title?: string; isPinned?: boolean } = {};
		if (args.title !== undefined) {
			updates.title = args.title;
		}
		if (args.isPinned !== undefined) {
			updates.isPinned = args.isPinned;
		}
		await ctx.db.patch(args.id, updates);
	},
});

export const generateTitle = internalAction({
	args: {
		chatId: v.id("chats"),
		content: v.string(),
		model: v.string(),
	},
	handler: async (ctx, args) => {
		let data = { title: "Untitled Chat" };

		// Attempt to generate a title for the chat based on the provided content
		try {
			data = await generateObject(
				args.model as ModelId,
				"You are an AI model tasked to return a title for the chat based on the messages provided. The title should be concise and relevant to the conversation. The title must be no longer than 50 characters.",
				[{ role: "user", content: args.content }],
				z.object({ title: z.string() })
			);
		} catch {
			console.error("Failed to generate chat title:", args.content);
		}

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
		model: v.optional(v.string()),
		messages: v.optional(v.array(v.id("messages"))),
	},
	handler: async (ctx, args) => {
		// Create a new chat and generate a title based on the provided content
		const chatId = await ctx.db.insert("chats", {
			title: "",
			isPinned: false,
			isAnswering: true,
		});

		// If it's a new chat, we can generate a title based on the content
		if (args.content && args.model) {
			await ctx.scheduler.runAfter(0, internal.chat.generateTitle, {
				chatId,
				content: args.content,
				model: args.model,
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
			branchOf: chat._id,
			isPinned: false,
			isAnswering: false,
		});

		// Insert the messages into the new chat
		for (const message of messagesToKeep) {
			await ctx.db.insert("messages", {
				...message,
				chatId: newChatId,
				isStreaming: false,
			});
		}

		return newChatId;
	},
});

export const deleteChat = mutation({
	args: {
		id: v.id("chats"),
	},
	handler: async (ctx, args) => {
		const chat = await ctx.db.get(args.id);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: args.id,
		});

		// Delete all associated messages
		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		await ctx.db.delete(args.id);
	},
});
