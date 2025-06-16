import { Brain, Eye, File, Globe, ImagePlus, Zap } from "lucide-react";

export type ModelFeatureId =
	| "fast"
	| "files"
	| "vision"
	| "image-generation"
	| "search"
	| "reasoning";

export type Feature = {
	name: string;
	id: ModelFeatureId;
	hidden: boolean;
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
		hidden: true,
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
		hidden: false,
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
		hidden: false,
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
		hidden: false,
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
		hidden: false,
		icon: Globe,
		description: "Uses search to answer questions",
		colors: {
			background: "bg-cyan-500/20",
			icon: "text-cyan-500",
		},
	},
	{
		name: "Reasoning",
		id: "reasoning",
		hidden: false,
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
