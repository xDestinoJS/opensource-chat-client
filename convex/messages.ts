import {
	httpAction,
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

function hasDelimiter(text: string) {
	return text.includes(".") || text.includes(",") || text.length > 100;
}

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
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) throw new Error("Message not found");

		const updates: any = {};
		if (args.content !== undefined) updates.content = args.content;
		if (args.isComplete !== undefined) updates.isComplete = args.isComplete;
		if (args.isStreaming !== undefined) updates.isStreaming = args.isStreaming;

		await ctx.db.patch(args.messageId, updates);
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

// === INTERNAL ACTIONS ===
export const streamAnswer = httpAction(async (ctx, req) => {
	const { chatId, assistantMessageId } = (await req.json()) as {
		chatId: Id<"chats">;
		assistantMessageId: Id<"messages">;
	};

	// Atomically attempt to claim the stream
	const canStream = await ctx.runMutation(internal.messages.startStreaming, {
		messageId: assistantMessageId,
	});

	if (!canStream) {
		// Another request is already handling this message, so we can return a conflict status.
		return new Response("Stream already in progress or message is complete.", {
			status: 409, // Conflict
		});
	}

	let messages = await ctx.runQuery(internal.messages.getMessageHistory, {
		chatId: chatId,
	});

	// Remove all messages until the assistant message
	const assistantMessageIndex = messages.findIndex(
		(m) => m._id === assistantMessageId
	);
	messages = messages.slice(0, assistantMessageIndex + 1);

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
	const result = await streamText(
		(messages[messages.length - 1].model ?? "mistral-small") as ModelId,
		history,
		controller.signal
	);

	const encoder = new TextEncoder();
	let content = "";

	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const text of result.textStream) {
					content += text;
					controller.enqueue(encoder.encode(text));

					if (hasDelimiter(text)) {
						(async () => {
							await ctx.runMutation(internal.messages.updateMessage, {
								messageId: assistantMessageId,
								content,
							});
						})();
					}
				}

				// On successful completion, mark the message as complete
				await ctx.runMutation(internal.messages.updateMessage, {
					messageId: assistantMessageId,
					content,
					isComplete: true,
					isStreaming: false,
				});
			} catch (err) {
				console.error("Streaming or DB update failed:", err);
				// Ensure the streaming flag is reset even on failure
				await ctx.runMutation(internal.messages.updateMessage, {
					messageId: assistantMessageId,
					isStreaming: false,
					// You might want to add an error message to the content
					content: content + "\n[Error: Stream failed]",
				});
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Transfer-Encoding": "chunked",
			"Cache-Control": "no-cache",
			"Access-Control-Allow-Origin": "*",
			Vary: "Origin",
		},
	});
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
		sessionId: v.string(),
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
			sessionId: args.sessionId,
			isComplete: true,
			isStreaming: false,
		});

		const assistantMessageId = await ctx.db.insert("messages", {
			chatId,
			role: "assistant",
			content: "",
			model: args.model,
			isComplete: false,
			sessionId: args.sessionId,
			isStreaming: false,
		});

		/* (async () => {
			await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
				chatId,
				assistantMessageId,
			});
		})();
 */
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

		/* await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId,
			assistantMessageId: messages[messages.length - 1]._id,
		}); */
	},
});

export const retryMessage = mutation({
	args: { messageId: v.id("messages") },
	handler: async (ctx, args) => {
		const chatId = await _handleMessageUpdate(ctx, args.messageId);

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId,
		});
		/* 
		await ctx.scheduler.runAfter(0, internal.messages.answerMessage, {
			chatId,
			assistantMessageId: messages[messages.length - 1]._id,
		}); */
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
