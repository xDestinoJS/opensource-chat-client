import {
	internalAction,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

import { streamText } from "../src/lib/ai";
import { Doc, Id } from "./_generated/dataModel";

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
		chatId: v.id("chats"),
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

		// Being the AI stream
		const response = await streamText("mistral-small", allMessages);

		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: "",
			isComplete: false, // Mark as incomplete before streaming
		});

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

export const sendMessage = mutation({
	args: {
		chatId: v.optional(v.id("chats")),
		content: v.string(),
		model: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Create a new chat if chatId is not provided
		if (!args.chatId) {
			args.chatId = await ctx.runMutation(internal.chat.createChat, {
				content: args.content,
			});

			if (!args.chatId) {
				throw new Error("[DB] Chat could not be created.");
			}
		} else {
			const chat = await ctx.db.get(args.chatId);
			if (!chat) {
				throw new Error("[DB] Chat not found.");
			}
		}

		if (args.chatId != undefined) {
			const chatId = args.chatId as Id<"chats">;

			// Insert the user message into the database
			await ctx.db.insert("messages", {
				chatId: chatId,
				role: "user",
				content: args.content,
				model: args.model,
				isComplete: true, // Mark as complete since it's a user message
			});

			async () => {
				const assistantMessageId = await ctx.db.insert("messages", {
					chatId: chatId,
					role: "assistant",
					content: "",
					model: args.model,
					isComplete: false,
				});

				await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
					chatId: chatId,
					messageId: assistantMessageId,
				});
			};

			return chatId;
		}
	},
});

export const editMessage = mutation({
	args: {
		messageId: v.id("messages"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("[DB] Message not found.");
		}

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: message.chatId,
		});
		const index = messages.findIndex((msg) => msg._id === args.messageId);

		// Conserve all messages to keep, including the edited message and the next one
		const messagesToKeep = messages.slice(0, index + 2);
		if (messagesToKeep.length < 2) {
			throw new Error("[DB] Not enough messages to edit.");
		}

		// Delete all messages after the edited message, except the next one
		for (const msg of messages) {
			if (!messagesToKeep.includes(msg)) {
				await ctx.db.delete(msg._id);
			}
		}

		// Update the edited message content using the reusable updateMessage
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: args.content,
			isComplete: true,
		});

		// Find the last assistant message to update
		await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId: message.chatId,
			messageId: messagesToKeep[messagesToKeep.length - 1]._id,
		});
	},
});

export const retryMessage = mutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("[DB] Message not found.");
		}

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: message.chatId,
		});
		const index = messages.findIndex((msg) => msg._id === args.messageId);

		// Conserve all messages to keep, including the edited message and the next one
		const messagesToKeep = messages.slice(0, index + 2);
		if (messagesToKeep.length < 2) {
			throw new Error("[DB] Not enough messages to edit.");
		}

		// Delete all messages after the message to retry
		for (const msg of messages) {
			if (!messagesToKeep.includes(msg)) {
				await ctx.db.delete(msg._id);
			}
		}

		// Re-run the answerMessage action to retry the message
		await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId: message.chatId,
			messageId: messagesToKeep[messagesToKeep.length - 1]._id,
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
			.withIndex("by_creation_time")
			.order("asc")
			.filter((q) => q.eq(q.field("chatId"), args.chatId))
			.collect();

		return messages;
	},
});

export const listMessages = query({
	args: {
		chatId: v.id("chats"),
	},
	handler: async (ctx, args) => {
		const messages: Doc<"messages">[] = await ctx.runQuery(
			internal.messages.getMessageHistory,
			{
				chatId: args.chatId,
			}
		);

		return messages;
	},
});
