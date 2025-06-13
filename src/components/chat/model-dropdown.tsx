"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModelId, Provider } from "@/lib/providers";
import Image from "next/image";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Info, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useState } from "react";

export default function ModelDropdown({
	modelId,
	setModelId,
	providersList,
}: {
	modelId: string;
	setModelId: (modelId: ModelId) => void;
	providersList: Provider[];
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const allModels = providersList.flatMap((p) => p.models);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>{modelId}</DropdownMenuTrigger>
			<DropdownMenuContent className="w-100" align="start" sideOffset={10}>
				<div className="flex gap-1 w-full items-center">
					<Search className="ml-2.25" size={18} />
					<Input
						className="grow outline-none border-none focus-visible:ring-0 shadow-none"
						placeholder="Search models..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.stopPropagation()}
					/>
				</div>
				<DropdownMenuSeparator />
				{allModels.map((model) => {
					return searchQuery.length == 0 ||
						model.name.toLowerCase().includes(searchQuery.toLowerCase()) ? (
						<DropdownMenuItem
							key={model.id}
							onClick={() => setModelId(model.id)}
							asChild
						>
							<Button
								className="w-full focus-visible:ring-0 text-sm justify-start gap-3"
								size="lg"
								variant="ghost"
							>
								<Image src={model.icon} alt={model.id} width={20} height={20} />
								<div className="flex items-center h-full">
									{model.name}
									<Tooltip>
										<TooltipTrigger>
											<div className="flex justify-center cursor-pointer items-enter p-2.5">
												<Info className="size-3" />
											</div>
										</TooltipTrigger>
										<TooltipContent>{model.description}</TooltipContent>
									</Tooltip>
								</div>
							</Button>
						</DropdownMenuItem>
					) : null;
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
