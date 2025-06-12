import models from "../src/lib/models";
import { query } from "./_generated/server";

export const getAvailableModels = query({
	handler: async (ctx, args) => {
		const availableModels = [];

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
