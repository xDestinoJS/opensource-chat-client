import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useModelFilters from "@/hooks/useModelFilters";
import filters from "@/lib/filters";
import { cn } from "@/lib/utils";
import { Check, Filter } from "lucide-react";

export default function FilterDropdown() {
	const { enabledFilters, toggleFilter, clearFilters } = useModelFilters();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="icon" variant="ghost">
					<Filter />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				side="right"
				className="flex flex-col p-1.25"
				sideOffset={10}
				alignOffset={-5}
			>
				{enabledFilters.length > 0 && (
					<>
						<Button
							className="w-full justify-start cursor-default"
							size="sm"
							variant="ghost"
							onClick={clearFilters}
						>
							Clear all
						</Button>

						<DropdownMenuSeparator />
					</>
				)}

				{filters.map((filter) => {
					const isEnabledFilter = enabledFilters.includes(filter.id);
					const Icon = filter.icon;

					return (
						<Button
							key={filter.id}
							className="justify-between p-1 w-45 cursor-default focus-visible:ring-0"
							variant="ghost"
							onClick={() => toggleFilter(filter.id)}
						>
							<div className="flex items-center gap-1.5 h-full">
								<div
									className={cn(
										"flex justify-center items-center h-full aspect-square rounded-sm",
										filter.colors.background
									)}
								>
									<Icon className={filter.colors.icon} />
								</div>
								{filter.name}
							</div>

							{isEnabledFilter && (
								<div>
									<Check />
								</div>
							)}
						</Button>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
