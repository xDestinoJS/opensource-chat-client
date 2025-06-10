export type ModelId = "gemini-2.5-pro" | "gemini-2.0-flash" | "mistral-small";

export type ModelConfig = {
	name: string;
	id: ModelId;
	description: string;
	maxTokens: number;
	temperature: number;
	topP: number;
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
		topP: 0.8,
		available: true,
		icon: "https://example.com/icons/gemini-2.0-flash.png",
	},
	{
		id: "mistral-small",
		name: "Mistral Small",
		description: "A compact model designed for small tasks.",
		maxTokens: 4096,
		temperature: 0.5,
		topP: 0.9,
		available: true,
		icon: "https://example.com/icons/mistral-small.png",
	},
	{
		id: "gemini-2.5-pro",
		name: "Gemini 2.5 Pro",
		description: "A compact model designed for small tasks.",
		maxTokens: 4096,
		temperature: 0.5,
		topP: 0.9,
		available: true,
		icon: "https://example.com/icons/mistral-small.png",
	},
];

export default models;
