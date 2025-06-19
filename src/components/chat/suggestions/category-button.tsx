import { Button } from "@/components/ui/button";
import React from "react";
import { SuggestionCategory } from "./main";

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
			variant={!isSelected ? "ghost" : "secondary"}
			size="lg"
			className="rounded-full shadow-xs border border-muted-foreground/10 bg-[#f6e5f3] dark:bg-[#27222d] hover:bg-[#f1c4e6] dark:hover:bg-[#362d3d]"
			onClick={() => onClick(category.id)}
		>
			{Icon && <Icon />}
			{category.title}
		</Button>
	);
}
