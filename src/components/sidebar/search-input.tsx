import { LucideIcon, Search, X } from "lucide-react";
import React, { KeyboardEvent } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { HiOutlineSlash } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type SearchInputProps = {
	query: string;
	setQuery: (query: string) => void;
	className?: string;
	icons?: LucideIcon[]; // optional array of icons (except Search)
	onEnter?: () => void;
	placeholder?: string;
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
};

export default function SearchInput({
	query,
	setQuery,
	className,
	icons = [],
	onEnter,
	placeholder = "Search your threads...",
	onKeyDown,
}: SearchInputProps) {
	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (onKeyDown) onKeyDown(e);

		if (e.key === "Enter" && onEnter) {
			onEnter();
		}
	}

	return (
		<div
			className={cn(
				"flex items-center w-full border-b border-primary/10 pl-2.5 gap-1",
				className
			)}
		>
			{/* First icon always Search */}
			<div className="flex items-center">
				<Search size={15} />

				{/* Render icons separated by slashes */}
				{icons.map((Icon, idx) => (
					<React.Fragment key={idx}>
						<div className="flex justify-center items-center">
							<HiOutlineSlash
								size={22.5}
								className="text-muted-foreground/40"
							/>
						</div>
						<Icon className="-ml-0.75" size={15} />
					</React.Fragment>
				))}
			</div>

			<Input
				className="grow shadow-none bg-transparent! rounded-none border-none outline-none focus-visible:ring-0 text-sm"
				placeholder={placeholder}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={handleKeyDown}
			/>

			{query.length > 0 && (
				<Button
					variant="ghost"
					size="icon"
					className="size-6"
					onClick={() => setQuery("")}
				>
					<X />
				</Button>
			)}
		</div>
	);
}
