"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getFullModelName, ModelId, Provider } from "@/lib/providers";
import Image from "next/image";
import { Button } from "../../ui/button";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

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
				className="w-full focus-visible:ring-0 text-sm justify-start gap-3"
				size="lg"
				variant="ghost"
				onClick={() => onSelect(model.id)}
			>
				{!hideProvider && (
					<div className="flex justify-center items-center border-r border-r-accent-foreground/10 h-full pr-3">
						<Tooltip>
							<TooltipTrigger asChild>
								<Image
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
				<Image src={model.icon} alt={model.id} width={20} height={20} />
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
			</Button>
		</DropdownMenuItem>
	);
}
