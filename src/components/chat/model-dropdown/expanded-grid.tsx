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
			className="flex flex-col gap-4 p-3 overflow-x-hidden max-h-120 -m-[3.475px]"
		>
			<ModelGrid
				models={favoritedModels}
				providers={providers}
				onSelect={onSelect}
				onToggleFavorite={onToggleFavorite}
				isFavorited={true}
			/>

			<ModelGrid
				models={nonFavoritedModels}
				providers={providers}
				onSelect={onSelect}
				onToggleFavorite={onToggleFavorite}
				isFavorited={false}
			/>
		</motion.div>
	);
}
