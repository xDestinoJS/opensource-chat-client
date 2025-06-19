import {
	generateObject as generateO,
	CoreMessage,
	experimental_generateImage as generateI,
	streamText as streamT,
	smoothStream,
	StreamTextOnChunkCallback,
	ToolSet,
	StreamTextOnFinishCallback,
	StreamTextOnErrorCallback,
} from "ai";
import { z } from "zod";

import {
	createGoogleGenerativeAI,
	GoogleGenerativeAIProviderOptions,
} from "@ai-sdk/google";
import { modelHasFeature, ModelId } from "./providers";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { createOpenAI } from "@ai-sdk/openai";

export type ReasoningEffort = "low" | "medium" | "high";

function getModel(
	modelId: ModelId,
	opts?: {
		isSearchEnabled?: boolean;
		apiKey?: string;
	}
) {
	const google = createGoogleGenerativeAI({
		apiKey: opts?.apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
	});

	const mistral = createMistral({
		apiKey: opts?.apiKey ?? process.env.MISTRAL_API_KEY,
	});

	const openrouter = createOpenRouter({
		apiKey: opts?.apiKey ?? process.env.OPENROUTER_API_KEY,
	});

	const openai = createOpenAI({
		apiKey: opts?.apiKey ?? process.env.OPENAI_API_KEY,
	});

	switch (modelId) {
		case "gemini-2.5-flash":
			return google("gemini-2.5-flash-preview-05-20", {
				useSearchGrounding: opts?.isSearchEnabled,
			});
		case "gpt-4o-mini":
			return openai("gpt-4o-mini");
		case "gemini-2.0-flash":
			return google("gemini-2.0-flash", {
				useSearchGrounding: opts?.isSearchEnabled,
			});
		case "mistral-small":
			return mistral("mistral-small-latest");
		case "llama-4-maverick":
			return openrouter("meta-llama/llama-4-maverick:free");
		case "deepseek-v3":
			return openrouter("deepseek/deepseek-v3-base:free");
		case "deepseek-r1":
			return openrouter("deepseek/deepseek-r1-0528:free");
		default:
			throw new Error(`[AI] Unsupported model: ${modelId}`);
	}
}

function getImageModel(
	modelId: ModelId,
	opts?: {
		apiKey?: string;
	}
) {
	const togetherai = createTogetherAI({
		apiKey: opts?.apiKey ?? process.env.TOGETHER_AI_API_KEY ?? "",
	});

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
export async function generateImage(
	modelId: ModelId,
	prompt: string,
	opts?: {
		apiKey?: string;
	}
) {
	let model = getImageModel(modelId, {
		apiKey: opts?.apiKey,
	});

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
	opts?: {
		isSearchEnabled?: boolean;
		reasoningEffort?: ReasoningEffort;
		onChunk?: StreamTextOnChunkCallback<ToolSet>;
		onError?: StreamTextOnErrorCallback;
		onFinish?: StreamTextOnFinishCallback<ToolSet>;
		systemPrompt?: string;
		apiKey?: string;
	}
) {
	let model = getModel(modelId, {
		isSearchEnabled: opts?.isSearchEnabled,
		apiKey: opts?.apiKey,
	});

	if (messages.length === 0) {
		throw new Error("[AI] No messages provided for chat completion.");
	}

	if (messages[messages.length - 1].role !== "user") {
		throw new Error("[AI] Last message must be from the user.");
	}

	const providerOptions: Record<string, any> = {};
	if (modelHasFeature(modelId, "reasoning")) {
		const thinkingBudget =
			opts?.reasoningEffort === "low"
				? 1000
				: opts?.reasoningEffort === "medium"
					? 6000
					: opts?.reasoningEffort === "high"
						? 15000
						: 2048;

		providerOptions.google = {
			thinkingConfig: {
				thinkingBudget,
				includeThoughts: true,
			},
		} satisfies GoogleGenerativeAIProviderOptions;
	}

	// streamT to not conflict with the `streamText` function
	return streamT({
		model,
		system: opts?.systemPrompt,
		messages,
		temperature: 0.3,
		maxRetries: 3,
		abortSignal: abortSignal,
		experimental_transform: smoothStream(),
		onChunk: opts?.onChunk,
		onError: opts?.onError,
		onFinish: opts?.onFinish,
		providerOptions,
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
	isSearchEnabled?: boolean,
	opts?: {
		apiKey?: string;
	}
) {
	let model = getModel(modelId, {
		isSearchEnabled,
		apiKey: opts?.apiKey,
	});

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
