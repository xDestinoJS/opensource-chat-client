import { ModelId, Provider } from "@/lib/providers";
import { motion } from "framer-motion";
import { Fragment } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Button } from "../../ui/button";
import Image from "next/image";
import { Pin, Star } from "lucide-react";

export default function ExpandedGrid({
	providers,
	onSelect,
}: {
	providers: Provider[];
	onSelect: (id: ModelId) => void;
}) {
	return (
		<motion.div
			key="expanded"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className="grid grid-cols-2 gap-3 p-3 overflow-x-hidden max-h-120 -m-[3.475px] sm:grid-cols-3 md:grid-cols-5"
		>
			{providers.map((provider) => (
				<Fragment key={provider.name}>
					{provider.models.map((model) => (
						<Tooltip key={model.id}>
							<TooltipTrigger asChild>
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
												<h2 className="text-accent-foreground/80">
													{model.version}
												</h2>
											</div>
										</div>
										<p className="text-xs text-muted-foreground">
											With {provider.name}
										</p>
									</Button>
									<Button
										className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100"
										size="icon"
										variant="outline"
									>
										<Pin />
									</Button>
								</div>
							</TooltipTrigger>
							<TooltipContent className="mb-2">
								{model.description}
							</TooltipContent>
						</Tooltip>
					))}
				</Fragment>
			))}
		</motion.div>
	);
}
