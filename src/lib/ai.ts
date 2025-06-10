import {
	generateObject as generateO,
	CoreMessage,
	streamText as streamT,
} from "ai";
import { z } from "zod";

import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { ModelId } from "./models";

function getModel(modelId: ModelId) {
	switch (modelId) {
		case "gemini-2.5-pro":
			return google("gemini-2.5-pro-exp-03-25");
		case "gemini-2.0-flash":
			return google("gemini-2.0-flash");
		case "mistral-small":
			return mistral("mistral-small-latest");
		default:
			throw new Error(`[AI] Unsupported model: ${modelId}`);
	}
}

/**
 * Stream a chat completion using the specified AI model.
 */
export async function streamText(
	modelId: ModelId,
	messages: CoreMessage[],
	abortSignal?: AbortSignal
) {
	let model = getModel(modelId);

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
	schema: z.ZodSchema
) {
	let model = getModel(modelId);

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
