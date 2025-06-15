import { ModelConfig, ModelId, Provider } from "@/lib/providers";
import Image from "next/image";
import { Pin, PinOff } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFeatureById } from "@/lib/features";
import { Button } from "@/components/ui/button";
import FeatureIcon from "../../feature-icon";

interface ExpandedGridButtonProps {
	model: ModelConfig;
	provider: Provider;
	onSelect: (id: ModelId) => void;
	onToggleFavorite: (id: ModelId) => void;
}

export function ExpandedGridButton({
	model,
	provider,
	onSelect,
	onToggleFavorite,
}: ExpandedGridButtonProps) {
	return (
		<Tooltip key={model.id}>
			<TooltipTrigger asChild>
				<div className="relative group h-37.5">
					<Button
						className="relative flex-col justify-between h-full w-full p-3 border rounded-lg focus-visible:ring-0"
						size="lg"
						variant="outline"
						onClick={() => onSelect(model.id)}
					>
						<div className="flex flex-col items-center gap-2">
							<Image
								src={model.icon}
								alt={model.id}
								className="size-[35px]"
								width={30}
								height={30}
							/>
							<div className="text-center text-normal">
								<h1 className="font-bold break-word text-accent-foreground">
									{model.brand}
								</h1>
								<h2 className="text-accent-foreground/80">{model.version}</h2>
							</div>
						</div>
						<div className="flex gap-1.5 ">
							{model.features.map((featureId) => {
								const feature = getFeatureById(featureId);
								if (feature?.hidden) return;

								return (
									<Tooltip key={featureId}>
										<TooltipTrigger asChild>
											<div className="cursor-default">
												<FeatureIcon featureId={featureId} />
											</div>
										</TooltipTrigger>
										<TooltipContent className="mb-1">
											{feature?.description}
										</TooltipContent>
									</Tooltip>
								);
							})}
						</div>

						<div className="absolute top-2.5 right-2.5">
							<Image
								src={provider.icon}
								alt={model.id}
								className="size-[13.5px]"
								width={13.5}
								height={13.5}
							/>
						</div>
					</Button>
					<Button
						className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100"
						size="icon"
						variant="outline"
						onClick={() => onToggleFavorite(model.id)}
					>
						{model.isFavorited ? <PinOff /> : <Pin />}
					</Button>
				</div>
			</TooltipTrigger>
			<TooltipContent className="mb-2">{model.description}</TooltipContent>
		</Tooltip>
	);
}
