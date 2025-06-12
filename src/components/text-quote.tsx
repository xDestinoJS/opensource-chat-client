import { CornerDownRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface TextQuoteProps {
	quote: string;
	variant: "background" | "foreground";
	onRemove?: () => void;
	className?: string;
}

export function TextQuote({
	quote,
	variant,
	onRemove,
	className,
}: TextQuoteProps) {
	return (
		<div
			className={cn(
				"flex items-center w-full rounded-lg p-2.5 px-3.5 gap-2 mb-2",
				variant == "foreground" &&
					"bg-accent-foreground/2.5 rounded-tl-xl rounded-tr-xl",
				variant == "background" && "bg-transparent",
				className
			)}
		>
			<div className="shrink-0 text-muted-foreground mr-1 mt-1">
				<CornerDownRight size={20} />
			</div>
			<p className="grow text-sm text-muted-foreground line-clamp-3">{quote}</p>
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
