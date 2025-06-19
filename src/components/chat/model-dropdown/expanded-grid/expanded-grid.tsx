import { ModelId, Provider } from "@/lib/providers";
import { motion } from "framer-motion";
import { ModelGrid } from "./model-grid";

export default function ExpandedGrid({
	providers,
	onSelect,
	onToggleFavorite,
}: {
	providers: Provider[];
	onSelect: (id: ModelId) => void;
	onToggleFavorite: (id: ModelId) => void;
}) {
	const favoritedModels = providers.flatMap((provider) =>
		provider.models.filter((model) => model.isFavorited)
	);
	const nonFavoritedModels = providers.flatMap((provider) =>
		provider.models.filter((model) => !model.isFavorited)
	);

	return (
		<motion.div
			key="expanded"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className="flex flex-col gap-4 p-3 overflow-x-hidden"
		>
			{favoritedModels.length > 0 && (
				<ModelGrid
					models={favoritedModels}
					providers={providers}
					onSelect={onSelect}
					onToggleFavorite={onToggleFavorite}
					isFavoriteGrid={true}
				/>
			)}

			{nonFavoritedModels.length > 0 && (
				<ModelGrid
					models={nonFavoritedModels}
					providers={providers}
					onSelect={onSelect}
					onToggleFavorite={onToggleFavorite}
					isFavoriteGrid={false}
				/>
			)}
		</motion.div>
	);
}
