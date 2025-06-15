import { z } from "zod";
import { ModelFeatureId } from "./features";

export const modelIds = z.enum([
	"gemini-2.5-pro",
	"gpt-4o",
	"gemini-2.0-flash",
	"mistral-small",
	"llama-4-maverick",
	"deepseek-v3",
]);
export type ModelId = z.infer<typeof modelIds>;

export type ModelConfig = {
	brand: string;
	version: string;
	id: ModelId;
	description: string;
	maxTokens: number;
	temperature: number;
	available: boolean;
	icon: string;
	isFavorited?: boolean;
	features: ModelFeatureId[];
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
				maxTokens: 8192,
				temperature: 0.2,
				available: true,
				icon: "/assets/icons/providers/gemini.svg",
				features: ["fast", "files", "vision"],
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
				maxTokens: 4096,
				temperature: 0.5,
				available: true,
				icon: "/assets/icons/providers/mistral.svg",
				features: ["files", "vision"],
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
				maxTokens: 128000,
				temperature: 0.5,
				available: true,
				icon: "/assets/icons/providers/openai.svg",
				features: ["vision"],
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
				maxTokens: 32768,
				temperature: 0.7,
				available: true,
				icon: "/assets/icons/providers/meta.svg",
				features: ["vision"],
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
				maxTokens: 16384,
				temperature: 0.6,
				available: true,
				icon: "/assets/icons/providers/deepseek.svg",
				features: [],
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

export default providers;
