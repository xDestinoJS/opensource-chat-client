import { httpAction, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { CoreMessage, FilePart, ImagePart, TextPart } from "ai";

import { generateImage, streamText } from "../src/lib/ai";
import { Doc } from "./_generated/dataModel";
import {
	getModelDataById,
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

		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				const result = await streamText(
					model as ModelId,
					history,
					llmCtrl.signal,
					{
						isSearchEnabled: assistantMessage.isSearchEnabled,
						reasoningEffort: reasoningEffort,
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
		const image = await generateImage(args.modelId as ModelId, args.prompt);

		// Handle the cancellation event
		const { cancelReason } = await ctx.runQuery(internal.messages.getMessage, {
			messageId: args.assistantMessageId,
		});
		if (cancelReason) return;

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
