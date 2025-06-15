import {
	httpAction,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

import { streamText } from "../src/lib/ai";
import { Doc, Id } from "./_generated/dataModel";
import { ModelId, modelIds } from "../src/lib/providers";

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
		sessionId: v.optional(v.string()),
		cancelReason: v.optional(v.union(v.string(), v.null())),
		model: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) throw new Error("Message not found");

		const updates: any = {};
		if (args.content !== undefined) updates.content = args.content;
		if (args.isComplete !== undefined) updates.isComplete = args.isComplete;
		if (args.isStreaming !== undefined) updates.isStreaming = args.isStreaming;
		if (args.sessionId !== undefined) updates.sessionId = args.sessionId;
		if (args.cancelReason !== undefined)
			updates.cancelReason =
				args.cancelReason != null ? args.cancelReason : undefined;
		if (args.model !== undefined) updates.model = args.model;

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

	// Avoid two streams for the same message
	const canStream = await ctx.runMutation(internal.messages.startStreaming, {
		messageId: assistantMessageId,
	});
	if (!canStream) {
		return new Response("Stream already in progress or message is complete.", {
			status: 409,
		});
	}

	// Clean message history
	let messages = await ctx.runQuery(internal.messages.getMessageHistory, {
		chatId,
	});
	const assistantIdx = messages.findIndex((m) => m._id === assistantMessageId);
	messages = messages.slice(0, assistantIdx + 1);

	const history = messages
		.slice(0, -1)
		.map((m) => ({
			role: m.role as "user" | "assistant",
			content: m.content,
		}))
		.filter((m) => m.content.length > 0);

	// If the user's last message has a quote, include it
	for (let i = history.length - 1; i >= 0; i--) {
		if (history[i].role === "user" && messages[i]?.quote) {
			history[i].content =
				`The user has quoted a previous message. You must keep it in mind when answering, but never mention it in the response. The quote is: "${messages[i].quote}"` +
				history[i].content;
			break;
		}
	}

	const llmCtrl = new AbortController();
	const result = await streamText(
		(messages.at(-1)?.model ?? "mistral-small") as ModelId,
		history,
		llmCtrl.signal
	);

	const encoder = new TextEncoder();
	let content = "";
	let lastSaved = 0;

	const savePartial = async () => {
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: assistantMessageId,
			content,
		});
	};

	const finish = async (finalContent: string) => {
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: assistantMessageId,
			content: finalContent,
			isComplete: true,
			isStreaming: false,
		});
	};

	// Runs no matter what
	const cleanup = async () => {
		await ctx.runMutation(internal.chat.updateChat, {
			chatId,
			isAnswering: false,
		});
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: assistantMessageId,
			isStreaming: false,
		});
	};

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			try {
				for await (const chunk of result.textStream) {
					const { cancelReason } = await ctx.runQuery(
						internal.messages.getMessage,
						{
							messageId: assistantMessageId,
						}
					);
					if (cancelReason) {
						llmCtrl.abort();
						await finish(content);
						await cleanup();
						controller.close();
						break;
					}

					content += chunk;
					controller.enqueue(encoder.encode(chunk));

					if (content.length - lastSaved >= 75) {
						lastSaved = content.length;
						void savePartial();
					}
				}

				await finish(content);
			} catch (err) {
				if (!llmCtrl.signal.aborted) controller.error(err);
			} finally {
				await cleanup();
			}
		},

		// Called when the stream disconnects from the client
		async cancel() {
			llmCtrl.abort();
			await finish(content);
			await cleanup();
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
	},
	handler: async (ctx, args) => {
		args.model = modelIds.parse(args.model ?? "mistral-small");

		let chat: Doc<"chats"> | null;

		if (!args.chatId) {
			args.chatId = await ctx.runMutation(internal.chat.createChat, {
				content: args.content,
				model: args.model,
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
