"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getFullModelName, ModelId, Provider } from "@/lib/providers";
import Image from "next/image";
import { Info } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import FeatureIcon from "../../feature-icon";

export default function NonExpandedModelButton({
	provider,
	model,
	onSelect,
	hideProvider,
}: {
	provider: Provider;
	model: Provider["models"][number];
	onSelect: (id: ModelId) => void;
	hideProvider?: boolean;
}) {
	return (
		<DropdownMenuItem key={model.id} asChild>
			<Button
				className="w-full focus-visible:ring-0 text-sm justify-between"
				size="lg"
				variant="ghost"
				onClick={() => onSelect(model.id)}
			>
				<div className="flex gap-3 items-center">
					{!hideProvider && (
						<div className="flex justify-center items-center border-r border-r-accent-foreground/10 h-full pr-3">
							<Tooltip>
								<TooltipTrigger asChild>
									<Image
										className="size-[20px]"
										src={provider.icon}
										alt={provider.id}
										width={20}
										height={20}
									/>
								</TooltipTrigger>
								<TooltipContent>With {provider.name}</TooltipContent>
							</Tooltip>
						</div>
					)}
					<Image
						className="size-[20px]"
						src={model.icon}
						alt={model.id}
						width={20}
						height={20}
					/>
					<div className="flex items-center">
						{getFullModelName(model.id)}
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center cursor-pointer p-2.5">
									<Info className="size-3" />
								</div>
							</TooltipTrigger>
							<TooltipContent>{model.description}</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<div className="flex gap-1">
					{model.features.map((featureId) => (
						<FeatureIcon featureId={featureId} />
					))}
				</div>
			</Button>
		</DropdownMenuItem>
	);
}
