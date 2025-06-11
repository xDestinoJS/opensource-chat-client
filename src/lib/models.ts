import { z } from "zod";

export const modelIds = z.enum([
	"gemini-2.5-pro",
	"gemini-2.0-flash",
	"mistral-small",
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

const models: ModelConfig[] = [
	{
		id: "gemini-2.0-flash",
		name: "Gemini 2.0 Flash",
		description: "A fast and efficient model for quick responses.",
		maxTokens: 8192,
		temperature: 0.2,
		available: true,
		icon: "/assets/icons/gemini.svg",
	},
	{
		id: "mistral-small",
		name: "Mistral Small",
		description: "A compact model designed for small tasks.",
		maxTokens: 4096,
		temperature: 0.5,
		available: true,
		icon: "/assets/icons/mistral.svg",
	},
];

export default models;
