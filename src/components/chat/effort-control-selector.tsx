import React, { ReactNode } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Changed import
import { Brain, BrainCircuit, BrainCog, LucideIcon } from "lucide-react";
import { useChatFeatures } from "@/stores/use-chat-features-store";
import { ReasoningEffort } from "@/lib/ai";

const options: {
	value: ReasoningEffort;
	label: string;
	icon: LucideIcon;
}[] = [
	{
		value: "high",
		label: "High",
		icon: Brain,
	},
	{
		value: "medium",
		label: "Medium",
		icon: BrainCircuit,
	},
	{
		value: "low",
		label: "Low",
		icon: BrainCog,
	},
];

export function getIconForReasoningEffort(
	reasoningEffort: ReasoningEffort
): LucideIcon {
	return options.find((option) => option.value === reasoningEffort)
		?.icon as LucideIcon;
}

export function EffortControlContent({ onSelect }: { onSelect?: () => void }) {
	const { reasoningEffort, setReasoningEffort } = useChatFeatures();

	return (
		<>
			{options.map((option) => {
				const Icon = option.icon;

				return (
					<DropdownMenuItem
						key={option.value}
						onSelect={() => {
							setReasoningEffort(option.value);
							onSelect && onSelect();
						}}
						// Optional: Add a visual indicator for the currently selected item
						// For example, by changing background or adding a checkmark
						className={
							reasoningEffort === option.value
								? "bg-accent text-accent-foreground"
								: ""
						}
					>
						<div className="flex items-center gap-2">
							<Icon />
							<span>{option.label}</span>
						</div>
					</DropdownMenuItem>
				);
			})}
		</>
	);
}

export function EffortControlSelector({
	children,
	onSelect,
	align,
}: {
	children: ReactNode;
	onSelect: () => void;
	align?: "center" | "start" | "end";
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div>{children}</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align={align ?? "center"}>
				<EffortControlContent onSelect={onSelect} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
