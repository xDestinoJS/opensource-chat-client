import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import providers, { ModelId } from "@/lib/providers";
import { ReactNode } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import NonExpandedModelButton from "./model-dropdown/non-expanded-list/non-expanded-list-button";
import LabeledSeparator from "../labeled-separator";
import { RefreshCcw } from "lucide-react";

export default function RetryDropdown({
	children,
	isDropdownOpen,
	setIsDropdownOpen,
	onRetry,
}: {
	children: ReactNode;
	isDropdownOpen: boolean;
	setIsDropdownOpen: (isOpen: boolean) => void;
	onRetry: (modelId?: ModelId) => void;
}) {
	return (
		<DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
			<DropdownMenuTrigger asChild>
				<div>{children}</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="center"
				className="z-50 bg-white border border-gray-200 rounded shadow-md w-50"
			>
				<DropdownMenuItem asChild>
					<Button
						className="w-full justify-start focus-visible:ring-0 gap-3"
						variant="ghost"
						size="default"
						onClick={() => onRetry()}
					>
						<RefreshCcw />
						<span>Retry same</span>
					</Button>
				</DropdownMenuItem>

				<LabeledSeparator text="or switch model" />

				{providers.map((provider) => (
					<DropdownMenuSub key={provider.id}>
						<DropdownMenuSubTrigger className="justify-start items-center h-9 gap-3 sx-4 py-2 has-[>svg]:px-3">
							<Image
								src={provider.icon}
								alt={provider.name}
								className="size-[16px] aspect-square"
								width={16}
								height={16}
							/>
							<span className="line-clamp-1">{provider.name}</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent className="w-70" sideOffset={10}>
								{provider.models.map((model) => (
									<DropdownMenuItem key={model.id} asChild>
										<NonExpandedModelButton
											key={model.id}
											model={model}
											onSelect={() => {
												onRetry(model.id);
											}}
											provider={provider}
											hideProvider
										/>
									</DropdownMenuItem>
								))}
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
