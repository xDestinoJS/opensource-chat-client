"use client";

import {
	getFullModelName,
	listAllModels,
	ModelId,
	modelHasFeature,
	recommendedModels,
} from "@/lib/providers";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import { getFeatureById } from "@/lib/features";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useModelFilters } from "@/stores/use-model-filters";
import { useMemo } from "react";
import FilterDropdown from "@/components/chat/model-dropdown/filter-dropdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import useIcon from "@/hooks/useIcon";

export default function Models() {
	const allModels = listAllModels();
	const { enabledFilters: featureFilters } = useModelFilters();
	const { data: sessionData } = useSession();

	const userPreferences = useQuery(
		api.userPreferences.getUserPreferences,
		sessionData ? { sessionToken: sessionData.session.token } : "skip"
	);
	const toggleFavoriteModel = useMutation(
		api.userPreferences.toggleFavoriteModel
	);

	const onToggleFavorite = async (id: ModelId, toggled?: boolean) => {
		if (sessionData) {
			await toggleFavoriteModel({
				sessionToken: sessionData.session.token,
				toggled: toggled,
				modelId: id,
			});
		}
	};

	// Solo mostramos los modelos que pasan los filtros activos
	const visibleModels = useMemo(
		() =>
			allModels.filter(
				(m) =>
					featureFilters.length === 0 ||
					featureFilters.every((f) => modelHasFeature(m.id, f))
			),
		[allModels, featureFilters]
	);

	async function unfavoriteAll() {
		for (const model of visibleModels) {
			void onToggleFavorite(model.id, false);
		}
	}

	async function selectRecommendedModels() {
		for (const model of visibleModels) {
			void onToggleFavorite(model.id, recommendedModels.includes(model.id));
		}
	}

	const { getModelIcon } = useIcon();

	return (
		<>
			<h1 className="text-2xl font-semibold">Available Models</h1>
			<p>
				Choose which models appear in your model selector. This won&apos;t
				affect existing conversations.
			</p>

			<div className="flex justify-between w-full flex-wrap">
				{/* Ahora el botón abre el mismo panel de filtros que en el desplegable */}
				<div className="flex gap-2 flex-wrap">
					<Button size="sm" variant="outline" onClick={selectRecommendedModels}>
						Select Recommended Models
					</Button>
					<Button size="sm" variant="outline" onClick={unfavoriteAll}>
						Unfavorite all
					</Button>
				</div>

				<FilterDropdown />
			</div>

			<ScrollArea className="w-full overflow-y-scroll">
				<div className="pr-3 max-h-160">
					{visibleModels.map((model) => (
						<div
							key={model.id}
							className="flex gap-5 w-full min-h-30 mb-4 border border-muted-foreground/20 rounded-lg p-5"
						>
							<Image
								src={getModelIcon(model.id)}
								alt="Model Icon"
								className="size-[40px]"
								width={40}
								height={40}
							/>

							<div className="flex flex-col justify-between grow">
								<div>
									<h1 className="font-bold">{getFullModelName(model.id)}</h1>
									<p className="text-sm">{model.description}</p>
								</div>

								<div className="flex gap-2 flex-wrap">
									{model.features.map(({ id: featureId, hidden }) => {
										const feature = getFeatureById(featureId);
										if (!feature) return null;

										const Icon = feature.icon;

										return (
											<Tooltip key={featureId}>
												<TooltipTrigger asChild>
													<div
														className={cn(
															"flex items-center gap-2 rounded-full text-sm p-2 py-0.5 select-none hover:saturate-140",
															feature.colors.background,
															feature.colors.icon
														)}
													>
														<Icon size={13} className={feature.colors.icon} />
														{feature.name}
													</div>
												</TooltipTrigger>
												<TooltipContent className="mb-2">
													{feature.description}
												</TooltipContent>
											</Tooltip>
										);
									})}
								</div>
							</div>

							<Switch
								className="cursor-pointer"
								checked={
									userPreferences?.favoriteModels?.includes(model.id) ?? false
								}
								onClick={() => onToggleFavorite(model.id)}
							/>
						</div>
					))}
				</div>
			</ScrollArea>
		</>
	);
}
