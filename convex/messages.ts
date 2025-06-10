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

/**
 * Internal mutation to update a message's content and completion status.
 */
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

/**
 * Internal query to retrieve a message by its ID.
 */
export const getMessage = internalQuery({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("[DB] Message not found.");
		}
		return message;
	},
});

/**
 * Internal action to answer a message using an AI model and stream the response.
 */
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

		// Begin the AI stream
		const controller = new AbortController();
		const response = await streamText(
			"mistral-small",
			allMessages,
			controller.signal
		);

		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: "",
			isComplete: false, // Mark as incomplete before streaming
		});

		// Add the new message to the end of the messages array
		let content = "";
		for await (const text of response.textStream) {
			content += text;

			const message = await ctx.runQuery(internal.messages.getMessage, {
				messageId: args.messageId,
			});

			if (message.isComplete) {
				controller.abort(); // Stop streaming if the message is already complete
				break; // Stop streaming if the message is it's already complete or has been cancelled
			}

			await ctx.runMutation(internal.messages.updateMessage, {
				messageId: args.messageId,
				content: content,
				isComplete: false, // Mark as incomplete while streaming
			});
		}

		// Final patch to mark as complete
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: content,
			isComplete: true, // Mark as complete after finished streaming
		});
	},
});

/**
 * Mutation to send a message to a chat, creating a new chat if necessary, and scheduling an AI response.
 */
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

			(async () => {
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
			})();

			return chatId;
		}
	},
});

/**
 * Internal function to handle common logic for message updates like edit and retry.
 * @param ctx - Convex context.
 * @param messageId - ID of the message being updated.
 * @returns The chat ID associated with the message.
 */
const _handleMessageUpdate = async (
	ctx: any,
	messageId: Id<"messages">
): Promise<Id<"chats">> => {
	const message = await ctx.db.get(messageId);
	if (!message) {
		throw new Error("[DB] Message not found.");
	}

	const messages: Doc<"messages">[] = await ctx.runQuery(
		internal.messages.getMessageHistory,
		{
			chatId: message.chatId,
		}
	);
	const index = messages.findIndex((msg) => msg._id === messageId);

	// Conserve all messages up to and including the message being edited/retried, and the next message (if it exists)
	const messagesToKeep = messages.slice(0, index + 2);
	if (messagesToKeep.length < 2) {
		throw new Error(
			"[DB] Not enough messages to edit/retry. Need at least the message and a subsequent message."
		);
	}

	// Delete all messages after the message being edited/retried
	for (const msg of messages) {
		if (!messagesToKeep.includes(msg)) {
			await ctx.db.delete(msg._id);
		}
	}

	return message.chatId;
};

/**
 * Mutation to edit an existing message and update the subsequent assistant message.
 */
export const editMessage = mutation({
	args: {
		messageId: v.id("messages"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		// Handle the common message update logic
		const chatId = await _handleMessageUpdate(ctx, args.messageId);

		// Update the edited message content
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: args.content,
			isComplete: true,
		});

		// Schedule the assistant to answer the next message
		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: chatId,
		});

		await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId: chatId,
			messageId: messages[messages.length - 1]._id,
		});
	},
});

/**
 * Mutation to retry an existing message and regenerate the subsequent assistant message.
 */
export const retryMessage = mutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		// Handle the common message update logic
		const chatId = await _handleMessageUpdate(ctx, args.messageId);

		// Schedule the assistant to answer the next message
		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: chatId,
		});

		await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId: chatId,
			messageId: messages[messages.length - 1]._id,
		});
	},
});

/**
 * Mutation to branch a conversation from a specific assistant message.
 */
export const branchMessage = mutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);

		if (!message) throw new Error("[DB] Message not found.");
		if (message.role !== "assistant") {
			throw new Error(
				"[DB] The message must be an assistant message to branch."
			);
		}

		const chat = await ctx.db.get(message.chatId);

		// Conserve all messages to keep
		const chatId: Id<"chats"> = await ctx.runMutation(
			internal.chat.branchChat,
			{
				messageId: args.messageId,
				title: chat?.title ?? "",
			}
		);

		if (!chatId) throw new Error("[DB] Branch was not succesful.");
		return chatId;
	},
});

/**
 * Mutation to cancel the current assistant message generation in a chat.
 */
export const cancelMessage = mutation({
	args: {
		chatId: v.id("chats"),
	},
	handler: async (ctx, args) => {
		const chat = await ctx.db.get(args.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}
		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: chat._id,
		});
		const message = messages[messages.length - 1]; // Get the last message

		if (message.role !== "assistant") {
			throw new Error(
				"[DB] The last message must be an assistant message to cancel."
			);
		}

		if (!message.isComplete) {
			await ctx.runMutation(internal.messages.updateMessage, {
				messageId: message._id,
				content: message.content, // Keep the current content
				isComplete: true, // Mark as complete to stop streaming
			});
		}
	},
});

/**
 * Internal query to retrieve the message history for a given chat.
 */
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

/**
 * Query to list messages for a given chat.
 */
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
