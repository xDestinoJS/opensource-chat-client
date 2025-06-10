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
 * Internal mutation to update a message's content (now an array) and completion status.
 * This is a general update, typically used for initial setup or finalization.
 */
export const updateMessage = internalMutation({
	args: {
		messageId: v.id("messages"),
		content: v.array(v.string()), // Updated to array of strings
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
 * Internal mutation to append a new chunk of text to a message's content array.
 * This is crucial for optimizing bandwidth during streaming.
 */
export const appendMessageContent = internalMutation({
	args: {
		messageId: v.id("messages"),
		newChunk: v.string(),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			console.error(
				`[DB] Message with ID ${args.messageId} not found for append.`
			);
			// You might want to throw an error or handle this more gracefully based on your app's needs
			return;
		}

		// Ensure content is an array, handle potential old data or initial states
		const currentContent = Array.isArray(message.content)
			? message.content
			: [];
		const updatedContent = [...currentContent, args.newChunk];

		await ctx.db.patch(args.messageId, {
			content: updatedContent,
			isComplete: false, // Ensure it stays incomplete during streaming
		});
	},
});

/**
 * Internal mutation to explicitly mark a message as complete.
 */
export const markMessageComplete = internalMutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.messageId, {
			isComplete: true,
		});
	},
});

/**
 * Internal query to retrieve a message by its ID.
 * The content returned will be an array of strings.
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
 * This function is now optimized for bandwidth by appending individual chunks.
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

		// Prepare messages for the AI model, joining content arrays into strings
		const allMessages = messages
			.slice(0, -1) // Remove the last message (which is the current assistant message placeholder)
			.map((m) => ({
				role: m.role as "user" | "assistant",
				// Join the content array back into a single string for the AI context
				content: Array.isArray(m.content) ? m.content.join("") : m.content,
			}));

		// Begin the AI stream
		const controller = new AbortController();
		const response = await streamText(
			"mistral-small",
			allMessages,
			controller.signal
		);

		// Initialize the assistant message content as an empty array
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: [], // Initialize as an empty array
			isComplete: false, // Mark as incomplete before streaming
		});

		for await (const text of response.textStream) {
			const isMessagePendingCancellation = await ctx.runQuery(
				internal.messageCancellations.isMessagePendingCancellation,
				{
					messageId: args.messageId,
				}
			);

			// Stop streaming if the message is requesting cancellation
			if (isMessagePendingCancellation) {
				await ctx.runMutation(
					internal.messageCancellations.removeCancellationRecord,
					{
						messageId: args.messageId,
					}
				);
				controller.abort();
				break;
			}

			// Append each text chunk directly to the message content array
			await ctx.runMutation(internal.messages.appendMessageContent, {
				messageId: args.messageId,
				newChunk: text,
			});
			// No need for hasDelimiter check here, as we update on every chunk
		}

		// Final patch to mark as complete
		await ctx.runMutation(internal.messages.markMessageComplete, {
			messageId: args.messageId,
		});
	},
});

/**
 * Mutation to send a message to a chat, creating a new chat if necessary, and scheduling an AI response.
 * User message content is stored as an array of one string.
 */
export const sendMessage = mutation({
	args: {
		chatId: v.optional(v.id("chats")),
		content: v.string(), // User input is still a single string here
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
			// Content is now an array containing the single user message string
			await ctx.db.insert("messages", {
				chatId: chatId,
				role: "user",
				content: [args.content], // Store as an array
				model: args.model,
				isComplete: true, // User messages are complete immediately
			});

			(async () => {
				const assistantMessageId = await ctx.db.insert("messages", {
					chatId: chatId,
					role: "assistant",
					content: [], // Assistant message starts as an empty array
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
 * It will now work with messages whose content is an array.
 * @param ctx - Convex context.
 * @param messageId - ID of the message being updated.
 * @returns The chat ID associated with the message.
 */
const _handleMessageUpdate = async (
	ctx: any, // Using 'any' for ctx for simplicity, ideally it's inferred
	messageId: Id<"messages">
): Promise<Id<"chats">> => {
	const message = await ctx.db.get(messageId);
	if (!message) {
		throw new Error("[DB] Message not found.");
	}

	// getMessageHistory will return messages with content as arrays
	const messages: Doc<"messages">[] = await ctx.runQuery(
		internal.messages.getMessageHistory,
		{
			chatId: message.chatId,
		}
	);
	const index = messages.findIndex((msg) => msg._id === messageId);

	// Conserve all messages up to and including the message being edited/retried
	const messagesToKeep = messages.filter(
		(msg, i) =>
			i <= index || // Keep all messages up to and including the selected message
			(message.role === "user" && i === index + 1) // If user message, keep the next assistant message
	);

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
 * The edited content is now stored as an array of one string.
 */
export const editMessage = mutation({
	args: {
		messageId: v.id("messages"),
		content: v.string(), // User input for edit is a single string
	},
	handler: async (ctx, args) => {
		// Handle the common message update logic
		const chatId = await _handleMessageUpdate(ctx, args.messageId);

		// Update the edited message content
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: [args.content], // Store edited content as an array
			isComplete: true, // Edited messages are complete immediately
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
 * This now uses the new answerMessage that supports array content.
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
 * This function inherently works with messages whose content is an array.
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

		// Conserve all messages to keep (handled by internal.chat.branchChat)
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
 * Internal query to retrieve the message history for a given chat.
 * The content field of messages returned will be an array of strings.
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
 * The content field of messages returned will be an array of strings.
 */
export const listMessages = query({
	args: {
		chatId: v.id("chats"),
	},
	handler: async (ctx, args) => {
		// getMessageHistory already returns messages with content as arrays
		const messages: Doc<"messages">[] = await ctx.runQuery(
			internal.messages.getMessageHistory,
			{
				chatId: args.chatId,
			}
		);

		return messages;
	},
});
