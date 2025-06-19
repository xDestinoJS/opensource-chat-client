import { Button } from "@/components/ui/button";
import React from "react";
import { SuggestionCategory } from "./main";
import { cn } from "@/lib/utils";

export default function CategoryButton({
	category,
	isSelected,
	onClick,
}: {
	category: SuggestionCategory;
	isSelected: boolean;
	onClick: (id: number) => void;
}) {
	const Icon = category.icon;

	return (
		<Button
			variant={!isSelected ? "ghost" : "default"}
			size="lg"
			className={cn(
				"rounded-full shadow-xs border border-muted-foreground/10",
				!isSelected
					? "bg-[#f6e5f3] dark:bg-[#27222d] hover:bg-[#f1c4e6] text-foreground hover:text-foreground dark:hover:bg-[#362d3d]"
					: "text-primary-foreground"
			)}
			onClick={() => onClick(category.id)}
		>
			{Icon && <Icon />}
			{category.title}
		</Button>
	);
}
