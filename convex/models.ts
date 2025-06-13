import { v } from "convex/values";
import providers, { ModelId } from "../src/lib/providers";
import { internal } from "./_generated/api";
import { internalQuery, mutation, query } from "./_generated/server";

export const getAvailableModels = internalQuery({
	handler: async (ctx) => {
		const availableModels: ModelId[] = [];

		for (const provider of providers) {
			for (const model of provider.models) {
				if (model.available) {
					if (process.env[provider.apiKeySource]) {
						availableModels.push(model.id);
					}
				}
			}
		}

		return availableModels;
	},
});

export const listAvailableModels = query({
	handler: async (ctx, args) => {
		const availableModels: ModelId[] = await ctx.runQuery(
			internal.models.getAvailableModels
		);
		return availableModels;
	},
});
