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
	args: { chatId: v.id("chats") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("messages")
			.withIndex("by_creation_time")
			.order("asc")
			.filter((q) => q.eq(q.field("chatId"), args.chatId))
			.collect();
	},
});

// === INTERNAL MUTATIONS ===
export const updateMessage = internalMutation({
	args: {
		messageId: v.id("messages"),
		content: v.optional(v.string()),
		isComplete: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) throw new Error("Message not found");

		const updates: any = {};
		if (args.content !== undefined) updates.content = args.content;
		if (args.isComplete !== undefined) updates.isComplete = args.isComplete;

		await ctx.db.patch(args.messageId, updates);
	},
});

// === INTERNAL ACTIONS ===
export const answerMessage = internalAction({
	args: {
		chatId: v.id("chats"),
		assistantMessageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: args.chatId,
		});

		const history = messages.slice(0, -1).map((m) => ({
			role: m.role as "user" | "assistant",
			content: m.content,
		}));

		for (let i = history.length - 1; i >= 0; i--) {
			if (history[i].role === "user" && messages[i]?.quote) {
				history[i].content =
					`The user has quoted a previous message. You must keep it in mind when answering, but never mention it in the response. The quote is: "${messages[i].quote}"` +
					history[i].content;
				break;
			}
		}

		const controller = new AbortController();
		const response = await streamText(
			(messages[messages.length - 1].model ?? "mistral-small") as ModelId,
			history,
			controller.signal
		);

		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.assistantMessageId,
			content: "",
			isComplete: false,
		});

		let content = "";
		for await (const text of response.textStream) {
			content += text;
			await ctx.runMutation(internal.messages.updateMessage, {
				messageId: args.assistantMessageId,
				content,
			});
		}

		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.assistantMessageId,
			isComplete: true,
		});
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

	return message.chatId;
};

// === PUBLIC MUTATIONS ===
export const sendMessage = mutation({
	args: {
		quote: v.optional(v.string()),
		chatId: v.optional(v.id("chats")),
		content: v.string(),
		model: v.string(),
	},
	handler: async (ctx, args) => {
		args.model = modelIds.parse(args.model ?? "mistral-small");

		if (!args.chatId) {
			args.chatId = await ctx.runMutation(internal.chat.createChat, {
				content: args.content,
				model: args.model,
			});
			if (!args.chatId) throw new Error("Chat could not be created");
		} else {
			const chat = await ctx.db.get(args.chatId);
			if (!chat) throw new Error("Chat not found");
		}

		const chatId = args.chatId as Id<"chats">;

		const messageId = await ctx.db.insert("messages", {
			chatId,
			role: "user",
			content: args.content,
			quote: args.quote,
			model: args.model,
			isComplete: true,
		});

		(async () => {
			const assistantMessageId = await ctx.db.insert("messages", {
				chatId,
				role: "assistant",
				content: "",
				model: args.model,
				isComplete: false,
			});

			await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
				chatId,
				assistantMessageId,
			});
		})();

		return { chatId, messageId };
	},
});

export const editMessage = mutation({
	args: {
		messageId: v.id("messages"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const chatId = await _handleMessageUpdate(ctx, args.messageId);

		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: args.content,
			isComplete: true,
		});

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId,
		});

		await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId,
			assistantMessageId: messages[messages.length - 1]._id,
		});
	},
});

export const retryMessage = mutation({
	args: { messageId: v.id("messages") },
	handler: async (ctx, args) => {
		const chatId = await _handleMessageUpdate(ctx, args.messageId);

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId,
		});

		await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId,
			assistantMessageId: messages[messages.length - 1]._id,
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
