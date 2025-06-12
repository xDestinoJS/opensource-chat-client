import models, { ModelId } from "../src/lib/models";
import { internal } from "./_generated/api";
import { internalQuery, query } from "./_generated/server";

export const getAvailableModels = internalQuery({
	handler: async (ctx) => {
		const availableModels: ModelId[] = [];

		for (const model of models) {
			if (model.available) {
				if (process.env[model.apiKeySource]) {
					// Check if the API key is available for the model
					availableModels.push(model.id);
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
