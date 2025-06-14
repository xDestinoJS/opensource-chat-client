import { ModelConfig, ModelId, Provider } from "@/lib/providers";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { ExpandedGridButton } from "./expanded-grid-button";
import { Pin } from "lucide-react";

interface ModelGridProps {
	models: ModelConfig[];
	providers: Provider[];
	onSelect: (id: ModelId) => void;
	onToggleFavorite: (id: ModelId) => void;
	isFavorited: boolean;
}

export function ModelGrid({
	models,
	providers,
	onSelect,
	onToggleFavorite,
	isFavorited,
}: ModelGridProps) {
	if (models.length === 0) {
		return null; // Don't render if there are no models
	}

	return (
		<div>
			<p className="flex items-center gap-2">
				{isFavorited && <Pin size={16} />}{" "}
				{isFavorited ? "Favorites" : "Others"}
			</p>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-2">
				{models.map((model) => {
					const provider = providers.find((p) =>
						p.models.some((m) => m.id === model.id)
					)!; // Find the provider for this model

					return (
						<Tooltip key={model.id}>
							<TooltipTrigger asChild>
								<ExpandedGridButton
									model={model}
									providerName={provider.name}
									onSelect={onSelect}
									onToggleFavorite={onToggleFavorite}
								/>
							</TooltipTrigger>
							<TooltipContent className="mb-2">
								{model.description}
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</div>
	);
}
