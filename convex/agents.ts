import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getSessionFromToken } from "./userPreferences";
import { authorizeUser } from "./chat";

export const createAgent = mutation({
	args: {
		title: v.string(),
		description: v.string(),
		systemPrompt: v.string(),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);

		args.title = args.title.trim().slice(0, 50);
		args.description = args.description.trim().slice(0, 100);
		args.systemPrompt = args.systemPrompt.trim().slice(0, 450);

		const { sessionToken, ...newArgs } = args;

		return await ctx.db.insert("agents", {
			...newArgs,
			ownerId: session.userId,
		});
	},
});

export const updateAgent = mutation({
	args: {
		id: v.id("agents"),
		title: v.string(),
		systemPrompt: v.string(),
		description: v.string(),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		await authorizeUser(
			ctx,
			args.sessionToken,
			{
				agentId: args.id,
			},
			true
		);

		args.title = args.title.trim().slice(0, 50);
		args.description = args.description.trim().slice(0, 100);
		args.systemPrompt = args.systemPrompt.trim().slice(0, 450);

		const { sessionToken, ...newArgs } = args;

		return await ctx.db.patch(args.id, newArgs);
	},
});

export const deleteAgent = mutation({
	args: {
		id: v.id("agents"),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		await authorizeUser(
			ctx,
			args.sessionToken,
			{
				agentId: args.id,
			},
			true
		);

		return await ctx.db.delete(args.id);
	},
});

export const getAgentDataInternal = internalQuery({
	args: {
		id: v.id("agents"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getAgentData = query({
	args: {
		id: v.id("agents"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getAllAgents = query({
	args: {
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);

		return await ctx.db
			.query("agents")
			.filter((q) => q.neq(q.field("ownerId"), session.userId))
			.collect();
	},
});

export const getOwnedAgents = query({
	args: {
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await getSessionFromToken(ctx, args.sessionToken);

		return await ctx.db
			.query("agents")
			.filter((q) => q.eq(q.field("ownerId"), session.userId))
			.collect();
	},
});
