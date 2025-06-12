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
import { ModelId, modelIds } from "../src/lib/models";

/**
 * Internal mutation to update a message.
 * Can set the entire content, append a chunk to the content, and/or update completion status.
 */
export const updateMessage = internalMutation({
	args: {
		messageId: v.id("messages"),
		content: v.optional(v.string()), // For setting the whole content
		newChunk: v.optional(v.string()), // For appending a chunk
		isComplete: v.optional(v.boolean()), // For marking complete/incomplete
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error(
				`[DB] Message with ID ${args.messageId} not found for update.`
			);
		}

		const fieldsToUpdate: { content?: string; isComplete?: boolean } = {};

		if (args.content !== undefined && args.newChunk !== undefined) {
			throw new Error(
				"[DB] Cannot provide both 'content' (for full replacement) and 'newChunk' (for appending) to updateMessage. Please provide only one."
			);
		}

		// Handle content update (full replacement or append)
		if (args.content !== undefined) {
			fieldsToUpdate.content = args.content;
		} else if (args.newChunk !== undefined) {
			const currentContent =
				typeof message.content === "string" ? message.content : "";
			fieldsToUpdate.content = currentContent + args.newChunk;
			// If appending a chunk, and isComplete is not explicitly set by the caller,
			// assume the message is not yet complete (streaming in progress).
			if (args.isComplete === undefined) {
				fieldsToUpdate.isComplete = false;
			}
		}

		// Handle completion status update
		// This can be set independently or along with content/newChunk.
		if (args.isComplete !== undefined) {
			fieldsToUpdate.isComplete = args.isComplete;
		}

		// Only patch if there's something to update
		if (Object.keys(fieldsToUpdate).length > 0) {
			await ctx.db.patch(args.messageId, fieldsToUpdate);
		}
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

		// Prepare messages for the AI model, content is now a string
		const allMessages = messages
			.slice(0, -1) // Remove the last message (which is the current assistant message placeholder)
			.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content as string, // Content is now a string
			}));

		// Add the quote to the last user message
		for (let i = allMessages.length - 1; i >= 0; i--) {
			const message = allMessages[i];

			if (message.role === "user") {
				const quote = messages[i]?.quote;

				if (quote) {
					allMessages[i].content =
						`The user has quoted a previous message. You must answer the user based on this quote. Don't make any mentions of it being a quote: "${quote}"` +
						allMessages[allMessages.length - 1].content;
				}

				break;
			}
		}

		// Begin the AI stream
		const controller = new AbortController();
		const response = await streamText(
			(messages[messages.length - 1].model ?? "mistral-small") as ModelId,
			allMessages,
			controller.signal
		);

		// Initialize the assistant message content as an empty string
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: "", // Initialize as an empty string
			isComplete: false, // Mark as incomplete before streaming
		});

		let streamWasCancelled = false; // Renamed for clarity, was `isCancelled`
		for await (const text of response.textStream) {
			// Always query for cancellation status in each iteration
			const isMessagePendingCancellation = await ctx.runQuery(
				internal.messageCancellations.isMessagePendingCancellation,
				{
					messageId: args.messageId,
				}
			);

			// Stop streaming if the message is requesting cancellation
			if (isMessagePendingCancellation || streamWasCancelled) {
				streamWasCancelled = true; // Mark that cancellation was handled

				await ctx.runMutation(
					internal.messageCancellations.removeCancellationRecord,
					{
						messageId: args.messageId,
					}
				);

				controller.abort(); // Signal the stream source to stop
				break; // Exit the loop immediately
			}

			await ctx.runMutation(internal.messages.updateMessage, {
				// Changed from appendMessageContent
				messageId: args.messageId,
				newChunk: text,
			});
		}

		await ctx.runMutation(internal.messages.updateMessage, {
			// Changed from markMessageComplete
			messageId: args.messageId,
			isComplete: true,
		});
	},
});

/**
 * Mutation to send a message to a chat, creating a new chat if necessary, and scheduling an AI response.
 * User message content is stored as an array of one string.
 */
export const sendMessage = mutation({
	args: {
		quote: v.optional(v.string()), // Optional quote for the message
		chatId: v.optional(v.id("chats")),
		content: v.string(), // User input is a single string
		model: v.string(),
	},
	handler: async (ctx, args) => {
		// Validate and parse the model ID, defaulting to "mistral-small" if not provided
		args.model = modelIds.parse(args.model ?? "mistral-small");

		// Create a new chat if chatId is not provided
		if (!args.chatId) {
			args.chatId = await ctx.runMutation(internal.chat.createChat, {
				content: args.content,
				model: args.model,
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
			// Content is now a string
			const messageId = await ctx.db.insert("messages", {
				chatId: chatId,
				role: "user",
				content: args.content, // Store as a string
				quote: args.quote,
				model: args.model,
				isComplete: true, // User messages are complete immediately
			});

			(async () => {
				const assistantMessageId = await ctx.db.insert("messages", {
					chatId: chatId,
					role: "assistant",
					content: "", // Assistant message starts as an empty string
					model: args.model,
					isComplete: false,
				});

				await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
					chatId: chatId,
					messageId: assistantMessageId,
				});
			})();

			return {
				chatId: chatId,
				messageId: messageId,
			};
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
			content: args.content, // Store edited content as a string
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
		return { chatId };
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
