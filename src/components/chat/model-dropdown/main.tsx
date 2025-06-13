"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFullModelName, ModelId, Provider } from "@/lib/providers";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { ChevronLeft, ChevronUp, Filter, Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ExpandedGrid from "./expanded-grid";
import NonExpandedList from "./non-expanded-list";

export default function ModelDropdown({
	modelId,
	setModelId,
	providersList,
}: {
	modelId: string;
	setModelId: (modelId: ModelId) => void;
	providersList: Provider[];
}) {
	const [isClient, setIsClient] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);

	useEffect(() => setIsClient(true), []);

	const filtered = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return providersList
			.map((p) => ({
				...p,
				models: p.models.filter(
					(m) => !q || getFullModelName(m.id).toLowerCase().includes(q)
				),
			}))
			.filter((p) => p.models.length);
	}, [providersList, searchQuery]);

	const select = (id: ModelId) => {
		setModelId(id);
		setIsOpen(false);
	};

	if (!isClient) return null;

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger>{modelId}</DropdownMenuTrigger>
			<DropdownMenuContent align="start" sideOffset={10}>
				{/* Search */}
				<div className="flex gap-1 w-full items-center">
					<Search className="ml-2.25" size={18} />
					<Input
						className="grow border-none focus-visible:ring-0 shadow-none"
						placeholder="Search models..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setIsExpanded(true);
						}}
						onKeyDown={(e) => e.stopPropagation()}
					/>
				</div>
				<DropdownMenuSeparator />

				{/* List and Grid */}
				<div
					className={cn(
						"transition-all duration-300 overflow-y-scroll overflow-x-hidden max-h-screen max-w-screen",
						!isExpanded ? "w-80 h-50" : "w-160 h-90"
					)}
				>
					<AnimatePresence mode="sync">
						{isExpanded ? (
							<ExpandedGrid providers={filtered} onSelect={select} />
						) : (
							<NonExpandedList providers={filtered} onSelect={select} />
						)}
					</AnimatePresence>
				</div>

				<DropdownMenuSeparator />

				{/* Footer */}
				<div className="flex justify-between items-center w-full">
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						{isExpanded ? (
							<>
								<ChevronLeft /> Favorites
							</>
						) : (
							<>
								<ChevronUp /> Show all
							</>
						)}
					</Button>
					<Button size="icon" variant="ghost">
						<Filter />
					</Button>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
