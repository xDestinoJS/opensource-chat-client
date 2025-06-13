import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const isMessagePendingCancellation = internalQuery({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		// Check if the message exists
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		// Check if the message is cancelled
		const cancellation = await ctx.db
			.query("messageCancellations")
			.filter((q) => q.eq(q.field("messageId"), args.messageId))
			.first();

		return cancellation !== null;
	},
});

export const removeCancellationRecord = internalMutation({
	args: {
		messageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		// Find the message by ID
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		// Check if the message is cancelled
		const cancellation = await ctx.db
			.query("messageCancellations")
			.filter((q) => q.eq(q.field("messageId"), args.messageId))
			.first();

		if (cancellation) {
			await ctx.db.delete(cancellation._id); // Remove the cancellation record
		} else {
			throw new Error("Message is not cancelled");
		}
		return cancellation;
	},
});

/**
 * Mutation to cancel the current assistant message generation in a chat.
 */
export const cancelMessage = mutation({
	args: {
		chatId: v.id("chats"),
		reason: v.optional(
			v.union(v.literal("user_request"), v.literal("system_error"), v.string())
		),
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

		// Ensure the last message (the message being streamed) is from the assistant
		if (message.role !== "assistant") {
			return console.log(
				"[DB] The last message must be an assistant message to cancel."
			);
		}

		if (message.isComplete) {
			return console.log(
				"[DB] The message is already complete and cannot be cancelled."
			);
		}

		// Check if the message is already cancelled
		const cancellation = await ctx.db
			.query("messageCancellations")
			.filter((q) => q.eq(q.field("messageId"), message._id))
			.first();

		if (!cancellation) {
			await ctx.db.insert("messageCancellations", {
				messageId: message._id,
				reason: args.reason ?? "user_request", // Default reason if not provided
			});
		} else {
			throw new Error(
				"[DB] Cancellation request already exists for this message."
			);
		}
	},
});
