import { ModelConfig, ModelId, Provider } from "@/lib/providers";
import { ExpandedGridButton } from "./expanded-grid-button";
import { Pin } from "lucide-react";

export function ModelGrid({
	models,
	providers,
	onSelect,
	onToggleFavorite,
	isFavoriteGrid,
}: {
	models: ModelConfig[];
	providers: Provider[];
	onSelect: (id: ModelId) => void;
	onToggleFavorite: (id: ModelId) => void;
	isFavoriteGrid: boolean;
}) {
	return (
		<div>
			<p className="flex items-center gap-2">
				{isFavoriteGrid && <Pin size={16} />}
				{isFavoriteGrid ? "Favorites" : "Others"}
			</p>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-2">
				{models.map((model) => {
					const provider = providers.find((p) =>
						p.models.some((m) => m.id === model.id)
					)!;

					return (
						<ExpandedGridButton
							key={model.id}
							model={model}
							onSelect={onSelect}
							onToggleFavorite={onToggleFavorite}
						/>
					);
				})}
			</div>
		</div>
	);
}
