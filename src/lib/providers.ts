import { z } from "zod";
import { ModelFeatureId } from "./features"; // Assuming ModelFeatureId is defined elsewhere

export const modelIds = z.enum([
	"gemini-2.5-flash",
	"gpt-4o",
	"gemini-2.0-flash",
	"mistral-small",
	"llama-4-maverick",
	"deepseek-v3",
	"deepseek-r1",
	"flux1-schnell",
]);
export type ModelId = z.infer<typeof modelIds>;

export type ModelConfig = {
	brand: string;
	version: string;
	id: ModelId;
	description: string;
	available: boolean;
	icon: string;
	isFavorited?: boolean;
	features: {
		id: ModelFeatureId;
		hidden: boolean;
	}[];
	type: "text" | "image";
};

export type Provider = {
	name: string;
	id: string;
	icon: string;
	apiKeySource: string;
	models: ModelConfig[];
};

const providers: Provider[] = [
	{
		name: "Gemini",
		id: "gemini",
		icon: "/assets/icons/providers/gemini.svg",
		apiKeySource: "GOOGLE_GENERATIVE_AI_API_KEY",
		models: [
			{
				id: "gemini-2.0-flash",
				brand: "Gemini",
				version: "2.0 Flash",
				description: "A fast and efficient model for quick responses",
				available: true,
				icon: "/assets/icons/providers/gemini.svg",
				type: "text",
				features: [
					{ id: "fast", hidden: true },
					{ id: "files", hidden: false },
					{ id: "vision", hidden: false },
					{ id: "search", hidden: false },
				],
			},
			{
				id: "gemini-2.5-flash",
				brand: "Gemini",
				version: "2.5 Flash",
				description: "A fast and efficient model for quick responses",
				available: true,
				icon: "/assets/icons/providers/gemini.svg",
				type: "text",
				features: [
					{ id: "fast", hidden: true },
					{ id: "effort-control", hidden: true },
					{ id: "files", hidden: false },
					{ id: "vision", hidden: false },
					{ id: "search", hidden: false },
					{ id: "reasoning", hidden: false },
				],
			},
		],
	},
	{
		name: "Mistral",
		id: "mistral",
		icon: "/assets/icons/providers/mistral.svg",
		apiKeySource: "MISTRAL_API_KEY",
		models: [
			{
				id: "mistral-small",
				brand: "Mistral",
				version: "Small",
				description: "A compact model designed for small tasks",
				available: true,
				icon: "/assets/icons/providers/mistral.svg",
				type: "text",
				features: [
					{ id: "files", hidden: false },
					{ id: "vision", hidden: false },
				],
			},
		],
	},
	{
		name: "OpenAI",
		id: "openai",
		icon: "/assets/icons/providers/openai.svg",
		apiKeySource: "OPENAI_API_KEY",
		models: [
			{
				id: "gpt-4o",
				brand: "GPT",
				version: "4o",
				description: "OpenAI's most advanced model",
				available: true,
				icon: "/assets/icons/providers/openai.svg",
				type: "text",
				features: [{ id: "vision", hidden: false }],
			},
		],
	},
	{
		name: "Llama",
		id: "llama",
		icon: "/assets/icons/providers/meta.svg",
		apiKeySource: "OPENROUTER_API_KEY",
		models: [
			{
				id: "llama-4-maverick",
				brand: "Llama",
				version: "4 Maverick",
				description: "An advanced model with high performance",
				available: true,
				icon: "/assets/icons/providers/meta.svg",
				type: "text",
				features: [{ id: "vision", hidden: false }],
			},
		],
	},
	{
		name: "DeepSeek",
		id: "deepseek",
		icon: "/assets/icons/providers/deepseek.svg",
		apiKeySource: "OPENROUTER_API_KEY",
		models: [
			{
				id: "deepseek-v3",
				brand: "DeepSeek",
				version: "V3",
				description: "A powerful model for complex tasks",
				available: true,
				icon: "/assets/icons/providers/deepseek.svg",
				type: "text",
				features: [], // No features listed, so it remains an empty array
			},
			{
				id: "deepseek-r1",
				brand: "DeepSeek",
				version: "R1",
				description: "Reasoning model for complex tasks",
				available: true,
				icon: "/assets/icons/providers/deepseek.svg",
				type: "text",
				features: [
					{ id: "effort-control", hidden: true },
					{ id: "reasoning", hidden: false },
				],
			},
		],
	},
	{
		name: "Black Forest Labs",
		id: "black-forest-labs",
		icon: "/assets/icons/providers/bfl.svg",
		apiKeySource: "TOGETHER_AI_API_KEY",
		models: [
			{
				id: "flux1-schnell",
				brand: "Flux.1",
				version: "Schnell",
				description: "A powerful model for complex tasks",
				available: true,
				icon: "/assets/icons/providers/bfl.svg",
				type: "image",
				features: [{ id: "image-generation", hidden: false }],
			},
		],
	},
];

export function getModelDataById(modelId: string | undefined) {
	for (const provider of providers) {
		for (const model of provider.models) {
			if (model.id === modelId) {
				return model;
			}
		}
	}
	return null;
}

export function getProviderDataById(providerId: string) {
	const provider = providers.find((p) => p.id == providerId);
	return provider;
}

export function getFullModelName(modelId: string | undefined) {
	const model = getModelDataById(modelId);
	if (!model) return "";
	return `${model.brand} ${model.version}`;
}

export function listAllModels(providerList?: Provider[]) {
	return (providerList ?? providers).flatMap((p) => p.models);
}

export function modelHasFeature(
	modelId: ModelId | null,
	featureId: ModelFeatureId
) {
	if (!modelId) return false;
	const model = getModelDataById(modelId);
	if (!model) return false;
	return model.features.some((f) => f.id === featureId);
}

export default providers;
