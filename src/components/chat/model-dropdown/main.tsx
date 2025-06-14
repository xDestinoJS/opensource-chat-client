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
import {
	ChevronDown,
	ChevronLeft,
	ChevronUp,
	Filter,
	Search,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ExpandedGrid from "./expanded-grid";
import NonExpandedList from "./non-expanded-list";
import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useSession } from "@/lib/auth-client";
import FilterDropdown from "./filter-dropdown";

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
	const inputRef = useRef<HTMLInputElement | null>(null);

	const { data: session } = useSession();

	const userPreferences = useQuery(api.userPreferences.getUserPreferences, {
		sessionToken: session?.session.token,
	});
	const toggleFavoriteModel = useMutation(
		api.userPreferences.toggleFavoriteModel
	);

	useEffect(() => setIsClient(true), []);

	const filtered = useMemo(() => {
		const favoriteModels = userPreferences?.favoriteModels || [];
		const q = searchQuery.trim().toLowerCase();

		console.log(userPreferences);

		return providersList
			.map((p) => ({
				...p,
				models: p.models
					.filter(
						(m) =>
							!q ||
							`${getFullModelName(m.id)} ${p.name}`.toLowerCase().includes(q)
					)
					.map((m) => ({
						...m,
						isFavorited: favoriteModels.includes(m.id),
					})),
			}))
			.filter((p) => p.models.length);
	}, [providersList, userPreferences, searchQuery, session]); // Add session to the dependency array

	const favorited = useMemo(() => {
		const favoriteModels = userPreferences?.favoriteModels || [];

		return providersList
			.map((p) => ({
				...p,
				models: p.models.filter((m) => favoriteModels.includes(m.id)),
			}))
			.filter((p) => p.models.length);
	}, [userPreferences, filtered]);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 250);
		}
	}, [isOpen]);

	const select = (id: ModelId) => {
		setModelId(id);
		setIsOpen(false);
	};

	const onToggleFavorite = async (id: ModelId) => {
		if (session) {
			await toggleFavoriteModel({
				sessionToken: session?.session.token,
				modelId: id,
			});
		}
	};

	return isClient ? (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm">
					{getFullModelName(modelId)} <ChevronDown />{" "}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" sideOffset={10}>
				{/* Search */}
				<div className="flex gap-1 w-full items-center">
					<Search className="ml-2.25" size={18} />
					<Input
						ref={inputRef}
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
							<ExpandedGrid
								providers={filtered}
								onSelect={select}
								onToggleFavorite={onToggleFavorite}
							/>
						) : (
							<NonExpandedList providers={favorited} onSelect={select} />
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
					<FilterDropdown />
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	) : (
		<div></div>
	);
}
