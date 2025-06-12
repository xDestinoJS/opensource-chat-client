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
	apiKeySource: string;
};

const models: ModelConfig[] = [
	{
		id: "gemini-2.0-flash",
		name: "Gemini 2.0 Flash",
		description: "A fast and efficient model for quick responses.",
		maxTokens: 8192,
		temperature: 0.2,
		available: true,
		icon: "/assets/icons/gemini.svg",
		apiKeySource: "GOOGLE_GENERATIVE_AI_API_KEY",
	},
	{
		id: "mistral-small",
		name: "Mistral Small",
		description: "A compact model designed for small tasks.",
		maxTokens: 4096,
		temperature: 0.5,
		available: true,
		icon: "/assets/icons/mistral.svg",
		apiKeySource: "MISTRAL_API_KEY",
	},
	{
		id: "llama-4-maverick",
		name: "Llama 4 Maverick",
		description: "An advanced model with high performance.",
		maxTokens: 32768,
		temperature: 0.7,
		available: true,
		icon: "/assets/icons/meta.svg",
		apiKeySource: "OPENROUTER_API_KEY",
	},
	{
		id: "deepseek-v3",
		name: "DeepSeek V3",
		description: "A powerful model for complex tasks.",
		maxTokens: 16384,
		temperature: 0.6,
		available: true,
		icon: "/assets/icons/deepseek.svg",
		apiKeySource: "OPENROUTER_API_KEY",
	},
];

export default models;
