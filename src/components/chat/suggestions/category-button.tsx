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
			className="rounded-full shadow-none border border-muted-foreground/10"
			onClick={() => onClick(category.id)}
		>
			{Icon && <Icon />}
			{category.title}
		</Button>
	);
}
