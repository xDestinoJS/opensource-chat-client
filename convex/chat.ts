import { v } from "convex/values";
import {
	internalAction,
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { generateObject } from "../src/lib/ai";
import { z } from "zod";
import { internal } from "./_generated/api";
import {
	getModelDataById,
	modelHasFeature,
	ModelId,
} from "../src/lib/providers";
import { Id } from "./_generated/dataModel";
import { getSessionFromToken } from "./userPreferences";

export const getChat = query({
	args: {
		chatId: v.id("chats"),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		authorizeUser(ctx, args.sessionToken, {
			chatId: args.chatId,
		});

		// Fetch the chat by ID
		const chat = await ctx.db.get(args.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		return chat;
	},
});

export const listChats = query({
	args: {
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);

		return await ctx.db
			.query("chats")
			.withIndex("byOwnerId", (q) => q.eq("ownerId", session.userId))
			.filter((q) => q.eq(q.field("isShared"), false))
			.order("desc")
			.collect();
	},
});

export const updateChat = internalMutation({
	args: {
		chatId: v.id("chats"),
		title: v.optional(v.string()),
		isAnswering: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const chat = await ctx.db.get(args.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		const updates: any = {};
		if (args.title !== undefined)
			updates.title = args.title != null ? args.title : undefined;
		if (args.isAnswering !== undefined)
			updates.isAnswering =
				args.isAnswering != null ? args.isAnswering : undefined;

		// Update the chat with the new title
		await ctx.db.patch(args.chatId, updates);
	},
});

export const shareChat = mutation({
	args: {
		chatId: v.id("chats"),
		toMessageId: v.optional(v.string()),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);

		authorizeUser(
			ctx,
			args.sessionToken,
			{
				chatId: args.chatId,
			},
			true
		);

		const chat = await ctx.db.get(args.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: chat._id,
		});
		const index = args.toMessageId
			? messages.findIndex((msg) => msg._id === args.toMessageId)
			: messages.length - 1;
		const messagesToKeep = messages.slice(0, index + 1);

		// Create a new chat with the same messages but a different title
		const newChatId = await ctx.db.insert("chats", {
			title: chat.title,
			isPinned: false,
			isAnswering: false,
			ownerId: session.userId,
			isShared: true,
		});

		// Insert the messages into the new chat
		for (const message of messagesToKeep) {
			const { _id, _creationTime, ...messageWithoutId } = message;
			await ctx.db.insert("messages", {
				...messageWithoutId,
				chatId: newChatId,
				isStreaming: false,
				isModifiable: false,
			});
		}

		return {
			chatId: newChatId,
		};
	},
});

export const updateChatData = mutation({
	args: {
		id: v.id("chats"),
		title: v.optional(v.string()),
		isPinned: v.optional(v.boolean()),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		authorizeUser(
			ctx,
			args.sessionToken,
			{
				chatId: args.id,
			},
			true
		);

		if (args.title != undefined && args.title.trim() === "") {
			throw new Error("Title cannot be empty.");
		}

		const updates: { title?: string; isPinned?: boolean } = {};
		if (args.title !== undefined) {
			updates.title = args.title;
		}
		if (args.isPinned !== undefined) {
			updates.isPinned = args.isPinned;
		}
		await ctx.db.patch(args.id, updates);
	},
});

export const generateTitle = internalAction({
	args: {
		chatId: v.id("chats"),
		content: v.string(),
		model: v.string(),
		isSearchEnabled: v.boolean(),
	},
	handler: async (ctx, args) => {
		let data = { title: "Untitled Chat" };

		const availableTextModels = (
			await ctx.runQuery(internal.models.getAvailableModels)
		).filter((modelId) => {
			const modelData = getModelDataById(modelId);
			return (
				modelData?.type == "text" && !modelHasFeature(modelId, "reasoning")
			);
		});

		// Attempt to generate a title for the chat based on the provided content
		if (availableTextModels.length > 0) {
			try {
				data = await generateObject(
					availableTextModels[0] as ModelId,
					"You are an AI model tasked to return a title for the chat based on the messages provided. The title should be concise and relevant to the conversation. The title must be no longer than 50 characters.",
					[{ role: "user", content: args.content }],
					z.object({ title: z.string() }),
					args.isSearchEnabled
				);
			} catch {
				console.error("Failed to generate chat title:", args.content);
			}
		}

		// Update the chat with the generated title
		await ctx.runMutation(internal.chat.updateChat, {
			chatId: args.chatId,
			title: data.title,
		});
	},
});

export const createChat = internalMutation({
	args: {
		content: v.optional(v.string()),
		model: v.optional(v.string()),
		messages: v.optional(v.array(v.id("messages"))),
		isSearchEnabled: v.boolean(),
		ownerId: v.id("user"),
		agentId: v.optional(v.id("agents")),
	},
	handler: async (ctx, args) => {
		// Create a new chat and generate a title based on the provided content
		const chatId = await ctx.db.insert("chats", {
			title: "",
			isPinned: false,
			isAnswering: true,
			ownerId: args.ownerId,
			isShared: false,
			agentId: args.agentId,
		});

		// If it's a new chat, we can generate a title based on the content
		if (args.content && args.model) {
			await ctx.scheduler.runAfter(0, internal.chat.generateTitle, {
				chatId,
				content: args.content,
				model: args.model,
				isSearchEnabled: args.isSearchEnabled,
			});
		}

		return chatId;
	},
});

export const branchChat = internalMutation({
	args: {
		messageId: v.id("messages"),
		title: v.string(),
		ownerId: v.optional(v.id("user")),
	},
	handler: async (ctx, args) => {
		const message = await ctx.db.get(args.messageId);
		if (!message) {
			throw new Error("[DB] Message not found.");
		}

		const chat = await ctx.db.get(message.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: chat._id,
		});
		const index = messages.findIndex((msg) => msg._id === args.messageId);
		const messagesToKeep = messages.slice(0, index + 1);

		// Create a new chat with the same messages but a different title
		const newChatId = await ctx.db.insert("chats", {
			title: args.title,
			branchOf: chat._id,
			isPinned: false,
			isAnswering: false,
			ownerId: args.ownerId ?? chat.ownerId,
			isShared: false,
			agentId: chat.agentId,
		});

		// Insert the messages into the new chat
		for (const message of messagesToKeep) {
			const { _id, _creationTime, ...messageWithoutId } = message;
			await ctx.db.insert("messages", {
				...messageWithoutId,
				chatId: newChatId,
				isStreaming: false,
				isModifiable: true,
			});
		}

		return newChatId;
	},
});

export const deleteChat = mutation({
	args: {
		id: v.id("chats"),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		authorizeUser(
			ctx,
			args.sessionToken,
			{
				chatId: args.id,
			},
			true
		);

		const chat = await ctx.db.get(args.id);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		const messages = await ctx.runQuery(internal.messages.getMessageHistory, {
			chatId: args.id,
		});

		// Delete all associated messages
		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		await ctx.db.delete(args.id);
	},
});

export async function authorizeUser(
	ctx: any, // Context object, likely from Convex functions
	sessionToken: string,
	of: {
		chatId?: Id<"chats"> | undefined;
		messageId?: Id<"messages"> | undefined;
		agentId?: Id<"agents"> | undefined;
	},
	ownerOnlyAction?: boolean
) {
	const session = await getSessionFromToken(ctx, sessionToken);

	let targetChatId: Id<"chats">;

	if (of.agentId) {
		const agent = await ctx.db.get(of.agentId);
		if (!agent) {
			throw new Error("Agent not found.");
		}
		if (session.userId == agent.ownerId) {
			return true;
		} else {
			throw new Error("You are not the owner of this agent.");
		}
	}

	// 1. Determine the target chatId
	if (of.chatId) {
		targetChatId = of.chatId;
	} else if (of.messageId) {
		const message = await ctx.db.get(of.messageId);
		if (!message) {
			throw new Error("Message not found.");
		}
		targetChatId = message.chatId;
	} else {
		// If neither chatId nor messageId is provided, we can't determine the chat.
		throw new Error("Either chatId or messageId must be provided.");
	}

	// 2. Fetch the chat once
	const chat = await ctx.db.get(targetChatId);
	if (!chat) {
		throw new Error("Chat not found.");
	}

	// 3. Apply ownerOnlyAction logic
	// If ownerOnlyAction is true, only the chat owner can proceed, regardless of visibility.
	if (ownerOnlyAction) {
		if (chat.ownerId !== session.userId) {
			throw new Error("This action can only be performed by the chat owner.");
		}
		// If the user is the owner and it's an owner-only action, they are authorized.
		return;
	}

	// 4. Apply general chat visibility logic (only if ownerOnlyAction is false)
	// If the chat is private and the user is not the owner, throw an error.
	if (!chat.isShared && chat.ownerId !== session.userId) {
		throw new Error("Chat is private and user is not the owner.");
	}

	// If none of the above conditions throw an error, the user is authorized.
}

export const getChatInternal = internalQuery({
	args: {
		chatId: v.id("chats"),
	},
	handler: async (ctx, args) => {
		// Fetch the chat by ID
		const chat = await ctx.db.get(args.chatId);
		if (!chat) {
			throw new Error("[DB] Chat not found.");
		}

		return chat;
	},
});
