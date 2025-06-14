import { Eye, File, Zap } from "lucide-react";

export type ModelFilterId = "fast" | "files" | "vision";

export const filters: {
	name: string;
	id: ModelFilterId;
	icon: any;
	description: string;
	colors: {
		background: string;
		icon: string;
	};
}[] = [
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
		description: "A fast and efficient model for quick responses",
		colors: {
			background: "bg-blue-500/20",
			icon: "text-blue-500",
		},
	},
	{
		name: "Vision",
		id: "vision",
		icon: Eye,
		description: "A fast and efficient model for quick responses",
		colors: {
			background: "bg-green-500/20",
			icon: "text-green-500",
		},
	},
];

export default filters;
