import { z } from "zod";

export const modelIds = z.enum([
	"gemini-2.5-pro",
	"gemini-2.0-flash",
	"mistral-small",
	"llama-4-maverick",
	"deepseek-v3",
]);
export type ModelId = z.infer<typeof modelIds>;

export type ModelConfig = {
	name: string;
	id: ModelId;
	description: string;
	maxTokens: number;
	temperature: number;
	available: boolean;
	icon: string;
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
		name: "Google",
		id: "google",
		icon: "/assets/icons/providers/google.svg",
		apiKeySource: "GOOGLE_GENERATIVE_AI_API_KEY",
		models: [
			{
				id: "gemini-2.0-flash",
				name: "Gemini 2.0 Flash",
				description: "A fast and efficient model for quick responses.",
				maxTokens: 8192,
				temperature: 0.2,
				available: true,
				icon: "/assets/icons/models/gemini.svg",
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
				name: "Mistral Small",
				description: "A compact model designed for small tasks.",
				maxTokens: 4096,
				temperature: 0.5,
				available: true,
				icon: "/assets/icons/providers/mistral.svg",
			},
		],
	},
	{
		name: "OpenAI",
		id: "openai",
		icon: "/assets/icons/providers/openai.svg",
		apiKeySource: "OPENAI_API_KEY",
		models: [],
	},
	{
		name: "Openrouter",
		id: "openrouter",
		icon: "/assets/icons/providers/openrouter.svg",
		apiKeySource: "OPENROUTER_API_KEY",
		models: [
			{
				id: "deepseek-v3",
				name: "DeepSeek V3",
				description: "A powerful model for complex tasks.",
				maxTokens: 16384,
				temperature: 0.6,
				available: true,
				icon: "/assets/icons/models/deepseek.svg",
			},
			{
				id: "llama-4-maverick",
				name: "Llama 4 Maverick",
				description: "An advanced model with high performance.",
				maxTokens: 32768,
				temperature: 0.7,
				available: true,
				icon: "/assets/icons/models/meta.svg",
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

export function listAllModels(providerList?: Provider[]) {
	return (providerList ?? providers).flatMap((p) => p.models);
}

export default providers;
