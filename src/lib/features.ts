import {
	Brain,
	Eye,
	File,
	Globe,
	ImagePlus,
	Settings2,
	Zap,
} from "lucide-react";

export type ModelFeatureId =
	| "fast"
	| "files"
	| "vision"
	| "image-generation"
	| "search"
	| "effort-control"
	| "reasoning";

export type Feature = {
	name: string;
	id: ModelFeatureId;
	icon: any;
	description: string;
	colors: {
		background: string;
		icon: string;
	};
};

export const features: Feature[] = [
	{
		name: "Fast",
		id: "fast",
		icon: Zap,
		description: "A fast and efficient model for quick responses",
		colors: {
			background: "bg-amber-500/20",
			icon: "text-amber-500",
		},
	},
	{
		name: "PDFs",
		id: "files",
		icon: File,
		description: "Support PDF uploads and analysis",
		colors: {
			background: "bg-blue-500/20",
			icon: "text-blue-500",
		},
	},
	{
		name: "Vision",
		id: "vision",
		icon: Eye,
		description: "Supports image uploads and analysis",
		colors: {
			background: "bg-green-500/20",
			icon: "text-green-500",
		},
	},
	{
		name: "Image Generation",
		id: "image-generation",
		icon: ImagePlus,
		description: "Can generate images",
		colors: {
			background: "bg-orange-500/20",
			icon: "text-orange-500",
		},
	},
	{
		name: "Search",
		id: "search",
		icon: Globe,
		description: "Uses search to answer questions",
		colors: {
			background: "bg-cyan-500/20",
			icon: "text-cyan-500",
		},
	},
	{
		name: "Effort Control",
		id: "effort-control",
		icon: Settings2,
		description: "Control the effort of the reasoning model",
		colors: {
			background: "bg-pink-500/20",
			icon: "text-pink-500",
		},
	},
	{
		name: "Reasoning",
		id: "reasoning",
		icon: Brain,
		description: "Has reasoning capabilities",
		colors: {
			background: "bg-purple-500/20",
			icon: "text-purple-500",
		},
	},
];

export const getFeatureById = (id: ModelFeatureId) => {
	return features.find((f) => f.id === id);
};

export default features;
