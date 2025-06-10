import {
	action,
	internalAction,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

import { streamText, generateObject } from "../src/lib/ai";
import { z } from "zod";

function hasDelimiter(response: string) {
	return (
		response.includes("\n") ||
		response.includes(".") ||
		response.includes("?") ||
		response.includes("!") ||
		response.includes(",") ||
		response.length > 100
	);
}

export const updateMessage = internalMutation({
	args: {
		messageId: v.id("messages"),
		content: v.string(),
		isComplete: v.boolean(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("[DB] Message not found.");
		}

		await ctx.db.patch(args.messageId, {
			content: args.content,
			isComplete: args.isComplete,
		});
	},
});

export const answerMessage = internalAction({
	args: {
		chatId: v.id("chats"), // Use "chats" if you have a separate chat table; adjust if needed
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: args.chatId,
		});
		const allMessages = messages
			.slice(0, -1) // Remove the last message
			.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content,
			}));

		console.log(allMessages);

		// Being the AI stream
		const response = await streamText("mistral-small", allMessages);

		// Add the new message to the end of the messages array
		let content = "";
		for await (const text of response.textStream) {
			content += text;

			if (hasDelimiter(text)) {
				await ctx.runMutation(internal.messages.updateMessage, {
					messageId: args.messageId,
					content: content,
					isComplete: false, // Mark as incomplete while streaming
				});
			}
		}

		// Final patch to mark as complete
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: content,
			isComplete: true, // Mark as complete after finished streaming
		});
	},
});

export const generateTitle = internalAction({
	args: {
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const data = await generateObject(
			"mistral-small",
			"You are an AI model tasked to return a title for the chat based on the messages provided. The title should be concise and relevant to the conversation. The title must be no longer than 50 characters.",
			[{ role: "user", content: args.content }],
			z.object({ title: z.string() })
		);

		return data.title;
	},
});

export const sendMessage = mutation({
	args: {
		chatId: v.optional(v.id("chats")), // Optional chatId for new chats
		content: v.string(),
		model: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Generate a chatId if not provided, using the content to create a title
		if (!args.chatId) {
			const data = {
				title: await ctx.scheduler.runAfter(
					0,
					internal.messages.generateTitle,
					{
						content: args.content,
					}
				),
			};

			args.chatId = await ctx.db.insert("chats", {
				title: data.title,
			});
		} else {
			const chat = await ctx.db.get(args.chatId);
			if (!chat) {
				throw new Error("[DB] Chat not found.");
			}
		}

		// Insert the user message into the database
		await ctx.db.insert("messages", {
			chatId: args.chatId,
			role: "user",
			content: args.content,
			model: args.model,
			isComplete: true, // Mark as complete since it's a user message
		});

		// Insert an assistant message placeholder
		const assistantMessageId = await ctx.db.insert("messages", {
			chatId: args.chatId,
			role: "assistant",
			content: "",
			model: args.model,
			isComplete: false,
		});

		await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId: args.chatId,
			messageId: assistantMessageId,
		});
	},
});

export const getMessageHistory = internalQuery({
	args: {
		chatId: v.id("chats"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_chatId_creationTime", (q) => q.eq("chatId", args.chatId))
			.order("asc")
			.collect();

		return messages;
	},
});

export const listMessages = query({
	args: {
		chatId: v.id("chats"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_chatId_creationTime", (q) => q.eq("chatId", args.chatId))
			.order("asc")
			.collect();

		return messages;
	},
});
