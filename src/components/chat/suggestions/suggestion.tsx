import { Button } from "@/components/ui/button";
import React from "react";

interface Suggestion {
	id: number;
	text: string;
}

export default function Suggestion({
	suggestion,
	onClick,
}: {
	suggestion: Suggestion;
	onClick: (id: number) => void;
}) {
	return (
		<div className="w-full not-last:border-b py-1 border-accent-foreground/10">
			<Button
				className="text-left w-full justify-start px-2 text-base whitespace-normal text-foreground/80 hover:text-foreground/90 hover:bg-highlight-background/2.5 dark:hover:bg-highlight-background/2.5 transition-none duration-0"
				variant="ghost"
				size="lg"
				onClick={() => onClick(suggestion.id)}
			>
				<span>{suggestion.text}</span>
			</Button>
		</div>
	);
}
