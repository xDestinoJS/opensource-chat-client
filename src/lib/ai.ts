import {
	generateObject as generateO,
	CoreMessage,
	experimental_generateImage as generateI,
	streamText as streamT,
} from "ai";
import { z } from "zod";

import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { togetherai } from "@ai-sdk/togetherai";
import { ModelId } from "./providers";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

function getModel(modelId: ModelId, isSearchEnabled?: boolean) {
	switch (modelId) {
		case "gemini-2.5-pro":
			return google("gemini-2.5-pro-exp-03-25");
		case "gemini-2.0-flash":
			if (isSearchEnabled)
				return google("gemini-2.0-flash", {
					useSearchGrounding: true,
				});
			return google("gemini-2.0-flash");
		case "mistral-small":
			return mistral("mistral-small-latest");
		case "llama-4-maverick":
			return openrouter("meta-llama/llama-4-maverick:free");
		case "deepseek-v3":
			return openrouter("deepseek/deepseek-v3-base:free");
		default:
			throw new Error(`[AI] Unsupported model: ${modelId}`);
	}
}

function getImageModel(modelId: ModelId) {
	switch (modelId) {
		case "flux1-schnell":
			return togetherai.image("black-forest-labs/FLUX.1-schnell-Free");
		default:
			throw new Error(`[AI] Unsupported model: ${modelId}`);
	}
}

/**
 * Generate an image using the specified AI model.
 */
export async function generateImage(modelId: ModelId, prompt: string) {
	let model = getImageModel(modelId);

	if (!prompt) throw new Error("No prompt was provided!");

	const { image } = await generateI({
		model,
		prompt,
		n: 1,
	});

	return image;
}

/**
 * Stream a chat completion using the specified AI model.
 */
export async function streamText(
	modelId: ModelId,
	messages: CoreMessage[],
	abortSignal?: AbortSignal,
	isSearchEnabled?: boolean
) {
	let model = getModel(modelId, isSearchEnabled);

	if (messages.length === 0) {
		throw new Error("[AI] No messages provided for chat completion.");
	}

	if (messages[messages.length - 1].role !== "user") {
		throw new Error("[AI] Last message must be from the user.");
	}

	return streamT({
		// streamT to not conflict with the `streamText` function
		model,
		messages,
		temperature: 0.3,
		maxRetries: 3,
		abortSignal: abortSignal,
	});
}

/**
 * Generates a structured chat completion using the specified AI model.
 */
export async function generateObject(
	modelId: ModelId,
	systemPrompt: string,
	messages: CoreMessage[],
	schema: z.ZodSchema,
	isSearchEnabled?: boolean
) {
	let model = getModel(modelId, isSearchEnabled);

	const { object } = await generateO({
		model,
		schema,
		messages,
		system: systemPrompt,
		temperature: 0.3,
		maxRetries: 3,
	});

	return object as z.infer<typeof schema>;
}
