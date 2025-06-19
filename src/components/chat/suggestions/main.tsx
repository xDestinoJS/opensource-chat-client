import React, { useState } from "react";
import Suggestion from "./suggestion";
import Category from "./category-button";
import {
	Code,
	GraduationCap,
	LucideIcon,
	Newspaper,
	Sparkles,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";

export type SuggestionCategory = {
	id: number;
	title: string;
	icon?: LucideIcon;
	suggestions: { id: number; text: string }[];
};

export default function SuggestionsContainer({
	onSelect,
}: {
	onSelect: (suggestion: string) => void;
}) {
	const { data: sessionData } = useSession();

	const [currentCategory, setCurrentCategory] = useState<number>(1);
	const categories: SuggestionCategory[] = [
		{
			id: 1,
			title: "Anything",
			suggestions: [
				{ id: 1, text: "How does AI work?" },
				{ id: 2, text: "Are black holes real?" },
				{ id: 3, text: 'How many Rs are in the word "strawberry"?' },
				{ id: 4, text: "What is the meaning of life?" },
			],
		},
		{
			id: 2,
			title: "Create",
			icon: Sparkles,
			suggestions: [
				{
					id: 1,
					text: "Write a short story about a robot discovering emotions",
				},
				{
					id: 2,
					text: "Help me outline a sci-fi novel set in a post-apocalyptic world",
				},
				{
					id: 3,
					text: "Create a character profile for a complex villain with sympathetic motives",
				},
				{ id: 4, text: "Give me 5 creative writing prompts for flash fiction" },
			],
		},
		{
			id: 3,
			title: "Explore",
			icon: Newspaper,
			suggestions: [
				{ id: 1, text: "Good books for fans of Rick Rubin" },
				{ id: 2, text: "Countries ranked by number of corgis" },
				{ id: 3, text: "Most successful companies in the world" },
				{ id: 4, text: "How much does Claude cost?" },
			],
		},
		{
			id: 4,
			title: "Code",
			icon: Code,
			suggestions: [
				{ id: 1, text: "Write code to invert a binary search tree in Python" },
				{
					id: 2,
					text: `What's the difference between Promise.all and Promise.allSettled?`,
				},
				{ id: 3, text: `Explain React's useEffect cleanup function` },
				{ id: 4, text: "Best practices for error handling in async/await" },
			],
		},
		{
			id: 5,
			title: "Learn",
			icon: GraduationCap,
			suggestions: [
				{ id: 1, text: `Beginner's guide to TypeScript` },
				{ id: 2, text: "Explain the CAP theorem in distributed systems" },
				{ id: 3, text: "Why is AI so expensive?" },
				{ id: 4, text: "Are black holes real?" },
			],
		},
	];

	function onSelectCategory(id: number) {
		if (id === currentCategory) return setCurrentCategory(1);
		setCurrentCategory(id);
	}

	function onSelectSuggestion(id: number) {
		const category = categories[currentCategory - 1];
		const suggestion = category.suggestions.find((s) => s.id === id);
		onSelect(suggestion?.text ?? "");
	}

	return (
		<motion.div
			className="flex flex-col gap-4.5 w-full max-w-2xl max-md:px-10"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.25 }}
		>
			<h1 className="text-3xl font-bold">
				{sessionData?.session && !sessionData?.user.isAnonymous
					? `How can I help you, ${sessionData?.user?.name}?`
					: "How can I help you?"}
			</h1>
			<div className="flex gap-3 overflow-y-scroll no-scrollbar">
				{categories.map(
					(category, index) =>
						index != 0 && (
							<Category
								key={category.id}
								category={category}
								isSelected={category.id === currentCategory}
								onClick={onSelectCategory}
							/>
						)
				)}
			</div>
			<div className="flex flex-col">
				{categories[currentCategory - 1].suggestions.map((suggestion) => (
					<Suggestion
						key={suggestion.id}
						suggestion={suggestion}
						onClick={onSelectSuggestion}
					/>
				))}
			</div>
		</motion.div>
	);
}
