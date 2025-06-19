import { httpAction, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { CoreMessage, FilePart, ImagePart, TextPart } from "ai";

import { generateImage, streamText } from "../src/lib/ai";
import { Doc } from "./_generated/dataModel";
import {
	getModelDataById,
	getProviderDataById,
	getProviderDataByModelId,
	modelHasFeature,
	ModelId,
} from "../src/lib/providers";
import { uploadUint8ArrayToBucket } from "../src/lib/files";
import { v } from "convex/values";

export const streamTextAnswer = httpAction(async (ctx, req) => {
	const { chatId, assistantMessageId } = await req.json();

	const canStream = await ctx.runMutation(internal.messages.startStreaming, {
		messageId: assistantMessageId,
	});
	if (!canStream) {
		return new Response("Stream already in progress or message is complete.", {
			status: 409,
		});
	}

	let messages = await ctx.runQuery(internal.messages.getMessageHistory, {
		chatId,
	});
	const assistantIdx = messages.findIndex((m) => m._id === assistantMessageId);
	messages = messages.slice(0, assistantIdx + 1);

	const assistantMessage = messages[assistantIdx];
	const modelInfo = getModelDataById(assistantMessage.model);

	if (!assistantMessage.model) throw new Error("Model not found.");

	if (modelInfo?.type == "text") {
		const history: CoreMessage[] = [];

		const toContentParts = (m: Doc<"messages">) => {
			const parts: (TextPart | ImagePart | FilePart)[] = [];

			if (m.content) parts.push({ type: "text", text: m.content });

			const addUrlParts = (
				list: string[] | undefined,
				type: "image" | "file",
				mimeType?: string
			) => {
				list?.forEach((url) => {
					try {
						const obj = new URL(url);
						parts.push(
							type === "image"
								? ({ type: "image", image: obj } as ImagePart)
								: ({ type: "file", data: obj, mimeType } as FilePart)
						);
					} catch (e) {
						console.error(`Invalid ${type} URL: ${url}`, e);
					}
				});
			};

			addUrlParts(
				m.images?.map((i) => i.uploadUrl),
				"image"
			);
			addUrlParts(
				m.documents?.map((i) => i.uploadUrl),
				"file",
				"application/pdf"
			);

			return parts;
		};

		// Add all messages to the history
		for (const m of messages.slice(0, -1)) {
			const parts = toContentParts(m);
			if (!parts.length) continue;

			if (m.role === "user") {
				history.push({ role: "user", content: parts });
			} else if (m.role === "assistant") {
				history.push({ role: "assistant", content: m.content });
			}
		}

		// Add quote if exists
		for (let i = history.length - 1; i >= 0; i--) {
			if (history[i].role === "user" && messages[i]?.quote) {
				history[i].content =
					`The user has quoted a previous message. You must keep it in mind when answering, but never mention it in the response. The quote is: "${messages[i].quote}"` +
					history[i].content;
				break;
			}
		}

		// Initiate reasoning object
		const isReasoningModel = modelHasFeature(
			assistantMessage.model as ModelId,
			"reasoning"
		);
		const reasoningEffort = assistantMessage.reasoningEffort;
		if (isReasoningModel) {
			await ctx.runMutation(internal.messages.updateMessage, {
				messageId: assistantMessageId,
				reasoning: {
					isReasoning: true,
					content: "",
					startedAt: Date.now(),
				},
			});
		}

		const llmCtrl = new AbortController();
		const model = messages.at(-1)?.model ?? "mistral-small";

		const encoder = new TextEncoder();
		let content = "";
		let reasoning = "";
		let reasoningEndedAt: number | undefined;
		let lastSaved = 0;

		const savePartial = async () => {
			await ctx.runMutation(internal.messages.updateMessage, {
				messageId: assistantMessageId,
				content,
				reasoning: isReasoningModel
					? {
							isReasoning: reasoningEndedAt ? false : true,
							content: reasoning,
							endedAt: reasoningEndedAt,
						}
					: undefined,
			});
		};

		const finish = async (
			result: any | null,
			finalContent: string,
			hasErrored?: boolean
		) => {
			await ctx.runMutation(internal.messages.updateMessage, {
				messageId: assistantMessageId,
				content: finalContent,
				reasoning: isReasoningModel
					? {
							isReasoning: false,
							content: reasoning,
							endedAt: reasoningEndedAt,
						}
					: undefined,
				isComplete: true,
				isStreaming: false,
				cancelReason: hasErrored ? "system_error" : undefined,
			});

			if (result) {
				const sources = (await result.sources).map(
					(source: { title: string; url: string }) => {
						return {
							title: source.title,
							url: source.url,
						};
					}
				);

				ctx.scheduler.runAfter(0, internal.sources.addSourcesToAnswer, {
					assistantMessageId,
					sources,
				});
			}
		};

		const cleanup = async () => {
			await ctx.runMutation(internal.chat.updateChat, {
				chatId,
				isAnswering: false,
			});

			await ctx.runMutation(internal.messages.updateMessage, {
				messageId: assistantMessageId,
				isStreaming: false,
				reasoning: isReasoningModel
					? {
							isReasoning: false,
							endedAt: reasoningEndedAt ?? Date.now(),
						}
					: undefined,
			});
		};

		const chat = await ctx.runQuery(internal.chat.getChatInternal, {
			chatId,
		});

		const userPreferences = await ctx.runQuery(
			internal.userPreferences.getInternalUserPreferences,
			{
				userId: chat.ownerId,
			}
		);

		let systemPrompt = `
		You are a helpful and versatile assistant. Your primary goal is to provide informative, relevant, and engaging responses tailored to the specific user you are interacting with. You will receive information about the user, including their name, occupation, traits, and any additional information they provide. Use this information to personalize your responses and make them as helpful and relevant as possible.

		Here's how you should use the provided user information:

		*   **Name:** Use the user's name to address them directly in a friendly and appropriate manner. For example, instead of saying "Here is the information you requested," say "Here is the information you requested, ${userPreferences?.chatSettings?.name ?? ""}." Adjust the level of formality based on the user's occupation and traits.
		*   **Occupation:** ( ${userPreferences?.chatSettings?.occupation ?? ""}) Consider the user's occupation when providing information. Tailor your responses to be relevant to their field and level of expertise. Use appropriate terminology and examples that resonate with their professional background. If the user asks for help with a task, consider how someone in their profession would approach it.
		*   **Traits:** ( ${userPreferences?.chatSettings?.traits.join(" ") ?? ""}) Take the user's traits into account when crafting your responses. If the user is described as "creative," offer innovative and imaginative solutions. If they are described as "detail-oriented," provide thorough and precise information. If they are described as "friendly," maintain a warm and approachable tone.
		*   **Additional Information:** ( ${userPreferences?.chatSettings?.additionalInfo ?? ""}) This section may contain any other relevant details about the user, such as their interests, goals, or current projects. Use this information to further personalize your responses and provide even more relevant and helpful assistance.
		`;

		if (chat.agentId) {
			const agent = await ctx.runQuery(internal.agents.getAgentDataInternal, {
				id: chat.agentId,
			});

			if (agent)
				systemPrompt += `The user is also using an "agent" who's system prompt is the following. You must follow it to perfection: ${agent?.systemPrompt}`;
		}

		const providerData = getProviderDataByModelId(model);
		const apiKey = userPreferences?.apiKeys?.find((data) => {
			return data.providerId === providerData?.id && data.key.length > 0;
		})?.key;

		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				const result = await streamText(
					model as ModelId,
					history,
					llmCtrl.signal,
					{
						isSearchEnabled: assistantMessage.isSearchEnabled,
						reasoningEffort: reasoningEffort,
						systemPrompt: userPreferences?.chatSettings && systemPrompt,
						apiKey,
						onChunk: async function (event) {
							const message = await ctx.runQuery(internal.messages.getMessage, {
								messageId: assistantMessageId,
							});

							if (message.cancelReason) {
								llmCtrl.abort();
								await finish(result, content);
								await cleanup();
								controller.close();
								return;
							}

							if (event.chunk.type == "reasoning") {
								reasoning += event.chunk.textDelta;
								const jsonChunk =
									JSON.stringify({ reasoning: event.chunk.textDelta }) + "\n";
								controller.enqueue(encoder.encode(jsonChunk));

								if (reasoning.length - lastSaved >= 75) {
									lastSaved = reasoning.length;
									void savePartial();
								}
							}
						},
						onError: async function (err) {
							llmCtrl.abort();
							await finish(result, content, true);
							await cleanup();
							controller.error(err);
						},
					}
				);

				try {
					for await (const chunk of result.textStream) {
						if (!reasoningEndedAt) {
							reasoningEndedAt = Date.now();
							await savePartial();
						}

						content += chunk;
						const jsonChunk = JSON.stringify({ text: chunk }) + "\n";
						controller.enqueue(encoder.encode(jsonChunk));

						if (content.length - lastSaved >= 75) {
							lastSaved = content.length;
							void savePartial();
						}
					}
				} catch (err) {
					if (!llmCtrl.signal.aborted) controller.error(err);
				} finally {
					await finish(result, content);
					await cleanup();
				}
			},

			async cancel() {
				llmCtrl.abort();
				await finish(null, content);
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
	} else {
		throw new Error("[STREAMING] Unknown model type.");
	}
});

export const processImageGeneration = internalAction({
	args: {
		modelId: v.string(),
		prompt: v.string(),
		chatId: v.id("chats"),
		assistantMessageId: v.id("messages"),
	},
	handler: async (ctx, args) => {
		// Handle the cancellation event
		const message = await ctx.runQuery(internal.messages.getMessage, {
			messageId: args.assistantMessageId,
		});
		if (message.cancelReason) return;

		const chat = await ctx.runQuery(internal.chat.getChatInternal, {
			chatId: args.chatId,
		});
		const userPreferences = await ctx.runQuery(
			internal.userPreferences.getInternalUserPreferences,
			{
				userId: chat.ownerId,
			}
		);
		const providerData = getProviderDataByModelId(message.model);
		const apiKey = userPreferences?.apiKeys?.find((data) => {
			return data.providerId === providerData?.id && data.key.length > 0;
		})?.key;

		const image = await generateImage(args.modelId as ModelId, args.prompt, {
			apiKey,
		});

		const fileId = crypto.randomUUID();

		const { Location } = await uploadUint8ArrayToBucket(
			image.uint8Array,
			fileId,
			image.mimeType
		);

		if (!Location) return;

		await ctx.runMutation(internal.messages.updateMessage, {
			messageId: args.assistantMessageId,
			images: [
				{
					name: fileId,
					fileId,
					uploadUrl: Location,
				},
			],
			isStreaming: false,
			isComplete: true,
		});

		await ctx.runMutation(internal.chat.updateChat, {
			chatId: args.chatId,
			isAnswering: false,
		});
	},
});

export const triggerImageGeneration = httpAction(async (ctx, req) => {
	const { chatId, assistantMessageId } = await req.json();

	const canStream = await ctx.runMutation(internal.messages.startStreaming, {
		messageId: assistantMessageId,
	});
	if (!canStream) {
		return new Response("Stream already in progress or message is complete.", {
			status: 409,
		});
	}

	let messages = await ctx.runQuery(internal.messages.getMessageHistory, {
		chatId,
	});
	const assistantIdx = messages.findIndex((m) => m._id === assistantMessageId);
	messages = messages.slice(0, assistantIdx + 1);

	const userMessage = messages[assistantIdx - 1];
	const assistantMessage = messages[assistantIdx];
	const modelInfo = getModelDataById(assistantMessage.model);
	if (!modelInfo || !assistantMessage.model)
		throw new Error("Model not found.");

	if (modelInfo?.type == "image") {
		// Generate and upload to S3
		await ctx.scheduler.runAfter(0, internal.generate.processImageGeneration, {
			modelId: assistantMessage.model,
			prompt: userMessage.content,
			chatId,
			assistantMessageId,
		});

		return new Response(
			JSON.stringify({
				success: true,
			}),
			{
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
			}
		);
	} else {
		throw new Error("[STREAMING] Unknown model type.");
	}
});
