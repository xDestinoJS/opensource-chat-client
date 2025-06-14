import { ModelConfig, ModelId } from "@/lib/providers";
import { Button } from "../../ui/button";
import Image from "next/image";
import { Pin, PinOff } from "lucide-react";

interface ExpandedGridButtonProps {
	model: ModelConfig;
	providerName: string;
	onSelect: (id: ModelId) => void;
	onToggleFavorite: (id: ModelId) => void;
}

export function ExpandedGridButton({
	model,
	providerName,
	onSelect,
	onToggleFavorite,
}: ExpandedGridButtonProps) {
	return (
		<div className="relative group h-40">
			<Button
				className="flex-col justify-between h-full w-full p-5 border rounded-lg focus-visible:ring-0"
				size="lg"
				variant="outline"
				onClick={() => onSelect(model.id)}
			>
				<div className="flex flex-col items-center gap-3">
					<Image
						src={model.icon}
						alt={model.id}
						className="size-[45px]"
						width={45}
						height={45}
					/>
					<div className="text-center text-normal">
						<h1 className="font-bold break-word text-accent-foreground">
							{model.brand}
						</h1>
						<h2 className="text-accent-foreground/80">{model.version}</h2>
					</div>
				</div>
				<p className="text-xs text-muted-foreground">With {providerName}</p>
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
	);
}
