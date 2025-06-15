import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import features from "@/lib/features";
import { Check, Filter } from "lucide-react";
import FeatureIcon from "../feature-icon";
import { useModelFilters } from "@/stores/use-model-filters";

export default function FilterDropdown() {
	const { enabledFilters, toggleFilter, clearFilters } = useModelFilters();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div className="relative">
					{enabledFilters.length > 0 && (
						<div className="absolute bg-blue-500 top-0.5 right-0.5 size-[7.5px] rounded-full" />
					)}
					<Button size="icon" variant="ghost">
						<Filter />
					</Button>
				</div>
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

				{features.map((feature) => {
					const isEnabledFilter = enabledFilters.includes(feature.id);

					return (
						<Button
							key={feature.id}
							className="justify-between p-1 w-45 cursor-default focus-visible:ring-0"
							variant="ghost"
							onClick={() => toggleFilter(feature.id)}
						>
							<div className="flex items-center gap-1.5 h-full">
								<FeatureIcon featureId={feature.id} />
								{feature.name}
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
