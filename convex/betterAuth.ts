import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
	ConvexHandler,
	type ConvexReturnType,
} from "@better-auth-kit/convex/handler";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

const { betterAuth, query, insert, update, delete_, count, getSession } =
	ConvexHandler({
		action,
		internalQuery,
		internalMutation,
		internal,
	}) as ConvexReturnType;

export { betterAuth, query, insert, update, delete_, count, getSession };
