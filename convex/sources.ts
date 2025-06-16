"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { https } from "follow-redirects";

export const addSourcesToAnswer = internalAction({
	args: {
		assistantMessageId: v.id("messages"),
		sources: v.array(
			v.object({
				title: v.optional(v.string()),
				url: v.string(),
			})
		),
	},
	handler: async (ctx, args) => {
		for (const source of args.sources) {
			const initialUrl = new URL(source.url);

			const resolvedSource = await new Promise<{ title: string; url: string }>(
				(resolve) => {
					const req = https.request(
						{
							host: initialUrl.host,
							path: initialUrl.pathname,
						},
						(res) => {
							resolve({
								title: source.title ?? "Source",
								url: res.headers.location || source.url,
							});
						}
					);

					req.on("error", () => {
						resolve({
							title: source.title ?? "Source",
							url: source.url,
						});
					});

					req.end();
				}
			);

			// Get current sources
			const message = await ctx.runQuery(internal.messages.getMessage, {
				messageId: args.assistantMessageId,
			});
			const sources = message.sources ?? [];

			const updatedSources = [
				...sources,
				{
					title: resolvedSource.title ?? initialUrl.hostname,
					url: resolvedSource.url,
				},
			];

			// Update message with appended sources
			if (resolvedSource.title) {
				await ctx.runMutation(internal.messages.updateMessage, {
					messageId: args.assistantMessageId,
					sources: updatedSources,
				});
			}
		}
	},
});
