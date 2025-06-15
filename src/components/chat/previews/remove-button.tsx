import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export default function RemoveButton({
	className,
	onRemove,
}: {
	className?: string;
	onRemove?: () => void;
}) {
	return (
		<button
			className={cn(
				"flex justify-center items-center cursor-pointer hover:shadow-sm size-5 aspect-square rounded-full bg-primary/60 text-secondary",
				className
			)}
			type="button"
			onClick={onRemove}
		>
			<X size={14} />
		</button>
	);
}
