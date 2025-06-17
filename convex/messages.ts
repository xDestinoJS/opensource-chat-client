import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

import { Doc, Id } from "./_generated/dataModel";
import { getModelDataById, modelIds } from "../src/lib/providers";
import { GenericFileData } from "../src/lib/files";

// === INTERNAL QUERIES ===
export const getMessage = internalQuery({
	args: { messageId: v.id("messages") },
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) throw new Error("Message not found");
		return message;
	},
});

export const getMessageHistory = internalQuery({
	args: { chatId: v.id("chats"), excludeSession: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const messageHistory = await ctx.db
			.query("messages")
			.withIndex("by_creation_time")
			.order("asc")
			.filter((q) => q.eq(q.field("chatId"), args.chatId))
			.collect();

		if (args.excludeSession) {
			messageHistory.forEach((message) => {
				if (
					message.role == "assistant" &&
					message.sessionId === args.excludeSession
				) {
					message.content = "";
					if (message.reasoning) message.reasoning.content = "";
				}
			});
		}

		return messageHistory;
	},
});

// === INTERNAL MUTATIONS ===
export const updateMessage = internalMutation({
	args: {
		messageId: v.id("messages"),
		content: v.optional(v.string()),
		isComplete: v.optional(v.boolean()),
		isStreaming: v.optional(v.boolean()),
		sessionId: v.optional(v.string()),
		cancelReason: v.optional(v.union(v.string(), v.null())),
		images: v.optional(
			v.array(
				v.object({
					name: v.string(),
					fileId: v.string(),
					uploadUrl: v.string(),
				})
			)
		),
		model: v.optional(v.string()),
		sources: v.optional(
			v.array(
				v.object({
					title: v.optional(v.string()),
					url: v.string(),
				})
			)
		),
		reasoning: v.optional(
			v.object({
				isReasoning: v.optional(v.boolean()),
				content: v.optional(v.string()),
				startedAt: v.optional(v.number()),
				endedAt: v.optional(v.number()),
			})
		),
		reasoningEffort: v.optional(
			v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
		),
	},

	handler: async (ctx, args) => {
		const { messageId, ...patch } = args;
		const message = await ctx.db.get(messageId);
		if (!message) throw new Error("Message not found");

		// build the real update object, merging nested objects
		const updates: Record<string, any> = { ...message };

		const deepMerge = (target: any, source: any) => {
			for (const [key, value] of Object.entries(source)) {
				if (value === undefined) continue; // ignore undefined
				if (value === null && key === "cancelReason") {
					target[key] = undefined; // clear cancelReason when null is passed
				} else if (
					typeof value === "object" &&
					!Array.isArray(value) &&
					value !== null
				) {
					target[key] = deepMerge(
						{ ...(target[key] ?? {}) },
						value as Record<string, any>
					);
				} else {
					target[key] = value;
				}
			}
			return target;
		};

		deepMerge(updates, patch);
		await ctx.db.patch(messageId, updates);
	},
});

export const startStreaming = internalMutation({
	args: { messageId: v.id("messages") },
	handler: async (ctx, { messageId }) => {
		const message = await ctx.db.get(messageId);
		if (!message) {
			throw new Error("Message not found");
		}

		if (message.isStreaming || message.isComplete) {
			return false;
		}

		// Atomically update the message to mark it as streaming
		await ctx.db.patch(messageId, {
			isStreaming: true,
			isComplete: false,
			content: "",
		});

		return true;
	},
});

// === SHARED UTILITY ===
const _handleMessageUpdate = async (ctx: any, messageId: Id<"messages">) => {
	const message = await ctx.db.get(messageId);
	if (!message) throw new Error("Message not found");

	const messages: Doc<"messages">[] = await ctx.runQuery(
		internal.messages.getMessageHistory,
		{
			chatId: message.chatId,
		}
	);

	const index = messages.findIndex((m) => m._id === messageId);
	const keep = messages.filter(
		(msg, i) => i <= index || (message.role === "user" && i === index + 1)
	);

	if (keep.length < 2) throw new Error("Not enough messages to retry/edit");

	for (const msg of messages) {
		if (!keep.includes(msg)) await ctx.db.delete(msg._id);
	}

	return {
		chatId: message.chatId,
		assistantMessageId: keep[keep.length - 1]._id,
	};
};

// === PUBLIC MUTATIONS ===
export const sendMessage = mutation({
	args: {
		quote: v.optional(v.string()),
		chatId: v.optional(v.id("chats")),
		sessionId: v.string(),
		content: v.string(),
		model: v.string(),
		isSearchEnabled: v.boolean(),
		fileDataList: v.array(
			v.object({
				name: v.string(),
				fileId: v.string(),
				uploadUrl: v.string(),
				mimeType: v.optional(v.string()),
			})
		),
		reasoningEffort: v.optional(
			v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
		),
	},
	handler: async (ctx, args) => {
		args.model = modelIds.parse(args.model ?? "mistral-small");

		let chat: Doc<"chats"> | null;

		if (!args.chatId) {
			args.chatId = await ctx.runMutation(internal.chat.createChat, {
				content: args.content,
				model: args.model,
				isSearchEnabled: args.isSearchEnabled,
			});
			if (!args.chatId) {
				throw new Error("Chat could not be created");
			}
			chat = await ctx.db.get(args.chatId);
		} else {
			chat = await ctx.db.get(args.chatId);
			if (chat?.isAnswering) {
				throw new Error("Answer is already being generated for chat.");
			}
		}

		if (!chat) throw new Error("Chat not found");
		const chatId = args.chatId as Id<"chats">;

		const images: GenericFileData[] = [];
		const documents: GenericFileData[] = [];
		args.fileDataList.forEach((data) => {
			(data?.mimeType?.startsWith("image/") ? images : documents).push({
				name: data.name.substring(0, 50),
				fileId: data.fileId,
				uploadUrl: data.uploadUrl,
			});
		});

		const modelInfo = getModelDataById(args.model);
		if (!modelInfo) throw new Error("Model data not found");

		// Set chat to answering state
		await ctx.runMutation(internal.chat.updateChat, {
			chatId,
			isAnswering: true,
		});

		const messageId = await ctx.db.insert("messages", {
			chatId,
			role: "user",
			content: args.content,
			quote: args.quote,
			model: args.model,
			sessionId: args.sessionId,
			images,
			documents,
			isComplete: true,
			isStreaming: false,
			isSearchEnabled: args.isSearchEnabled,
			reasoningEffort: args.reasoningEffort,
		});

		const assistantMessageId = await ctx.db.insert("messages", {
			chatId,
			role: "assistant",
			content: "",
			model: args.model,
			sessionId: args.sessionId,
			images: [],
			documents: [],
			isComplete: false,
			isStreaming: false,
			isSearchEnabled: args.isSearchEnabled,
			reasoningEffort: args.reasoningEffort,
		});

		return {
			chatId,
			messageId,
			assistantMessageId,
		};
	},
});

export const editMessage = mutation({
	args: {
		messageId: v.id("messages"),
		content: v.string(),
		sessionId: v.string(),
	},
	handler: async (ctx, args) => {
		const { chatId, assistantMessageId } = await _handleMessageUpdate(
			ctx,
			args.messageId
		);

		// Update the user's message
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: args.content,
			isComplete: true,
		});

		// Set chat to answering state
		await ctx.runMutation(internal.chat.updateChat, {
			chatId,
			isAnswering: true,
		});

		// Update the assistant's message
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: assistantMessageId,
			content: "",
			isComplete: false,
			isStreaming: false,
			sessionId: args.sessionId,
			cancelReason: null,
			reasoning: undefined,
			sources: [],
			images: [],
		});
	},
});

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

		await ctx.runMutation(internal.chat.updateChat, {
			chatId: chat._id,
			isAnswering: false,
		});

		// Check if the message is already
		if (!message.cancelReason) {
			await ctx.runMutation(internal.messages.updateMessage, {
				messageId: message._id,
				isComplete: true,
				cancelReason: args.reason ?? "user_request",
			});
		}
	},
});

export const retryMessage = mutation({
	args: {
		messageId: v.id("messages"),
		sessionId: v.string(),
		modelId: v.optional(v.string()),
		reasoningEffort: v.optional(
			v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
		),
	},
	handler: async (ctx, args) => {
		const { chatId, assistantMessageId } = await _handleMessageUpdate(
			ctx,
			args.messageId
		);

		if (args.modelId) modelIds.parse(args.modelId); // Validate that the modelId is real

		// Set chat to answering state
		await ctx.runMutation(internal.chat.updateChat, {
			chatId,
			isAnswering: true,
		});

		// Update the assistant's message
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: assistantMessageId,
			content: "",
			model: args.modelId,
			isComplete: false,
			isStreaming: false,
			sessionId: args.sessionId,
			cancelReason: null,
			reasoningEffort: args.reasoningEffort,
			reasoning: undefined,
			sources: [],
			images: [],
		});
	},
});

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

// === PUBLIC QUERIES ===
export const listMessages = query({
	args: {
		chatId: v.id("chats"),
		excludeSession: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const messages: Doc<"messages">[] = await ctx.runQuery(
			internal.messages.getMessageHistory,
			{
				chatId: args.chatId,
				excludeSession: args.excludeSession,
			}
		);

		return messages;
	},
});
