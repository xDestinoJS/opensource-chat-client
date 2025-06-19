import { CornerDownRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface TextQuoteProps {
	quote: string;
	variant: "background" | "foreground";
	onRemove?: () => void;
	className?: string;
	paragraphClassName?: string;
}

export function TextQuote({
	quote,
	variant,
	onRemove,
	className,
	paragraphClassName,
}: TextQuoteProps) {
	return (
		<div
			className={cn(
				"flex items-center w-full rounded-lg overflow-hidden p-2.5 px-3.5 gap-2 mb-2",
				variant == "foreground" &&
					"bg-accent-foreground/2.5 rounded-tl-xl rounded-tr-xl",
				variant == "background" && "justify-end",
				className
			)}
		>
			<div className="shrink-0 text-muted-foreground mr-1 mt-1">
				<CornerDownRight size={20} />
			</div>
			<div className="text-sm text-muted-foreground break-all line-clamp-3">
				{quote}
			</div>

			{onRemove && (
				<Button
					className="shrink-0"
					size="icon"
					variant="ghost"
					onClick={onRemove}
				>
					<X />
				</Button>
			)}
		</div>
	);
}
