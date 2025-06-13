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

	if (
		!(await ctx.runMutation(internal.messages.startStreaming, {
			messageId: assistantMessageId,
		}))
	) {
		return new Response("Stream already in progress or message is complete.", {
			status: 409,
		});
	}

	let messages = await ctx.runQuery(internal.messages.getMessageHistory, {
		chatId,
	});

	const assistantIdx = messages.findIndex((m) => m._id === assistantMessageId);
	messages = messages.slice(0, assistantIdx + 1);

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

	// one controller for the LLM…
	const llmCtrl = new AbortController();
	const result = await streamText(
		(messages[messages.length - 1].model ?? "mistral-small") as ModelId,
		history,
		llmCtrl.signal
	);

	// …and one for the client connection
	const encoder = new TextEncoder();
	let content = "";
	let lastSaved = 0;

	const stream = new ReadableStream({
		async start(push) {
			try {
				for await (const chunk of result.textStream) {
					// was the message cancelled?
					const { cancelReason } = await ctx.runQuery(
						internal.messages.getMessage,
						{ messageId: assistantMessageId }
					);

					if (cancelReason) {
						llmCtrl.abort(); // stop the LLM
						push.enqueue(encoder.encode("[[CANCEL:USER_REQUEST]]"));
						push.close(); // stop sending chunks
						await ctx.runMutation(internal.messages.updateMessage, {
							messageId: assistantMessageId,
							isStreaming: false,
						});
						return;
					}

					content += chunk;
					push.enqueue(encoder.encode(chunk));

					if (content.length - lastSaved >= 75) {
						lastSaved = content.length;
						void ctx.runMutation(internal.messages.updateMessage, {
							messageId: assistantMessageId,
							content,
						});
					}
				}

				await ctx.runMutation(internal.messages.updateMessage, {
					messageId: assistantMessageId,
					content,
					isComplete: true,
					isStreaming: false,
				});
			} catch (err) {
				// Ignore abort errors; re‑throw the rest
				if (!llmCtrl.signal.aborted) push.error(err);
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
		sessionId: v.string(),
	},
	handler: async (ctx, args) => {
		const { assistantMessageId } = await _handleMessageUpdate(
			ctx,
			args.messageId
		);

		// Update the user's message
		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.messageId,
			content: args.content,
			isComplete: true,
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

		if (message.isComplete) {
			return console.log(
				"[DB] The message is already complete and cannot be cancelled."
			);
		}

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
	},
	handler: async (ctx, args) => {
		const { assistantMessageId } = await _handleMessageUpdate(
			ctx,
			args.messageId
		);

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
