import { Eye, File, Zap } from "lucide-react";

export type ModelFeatureId = "fast" | "files" | "vision";

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
];

export const getFeatureById = (id: ModelFeatureId) => {
	return features.find((f) => f.id === id);
};

export default features;
