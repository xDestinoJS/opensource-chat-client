"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type Props = {
	label: string;
	onClick?: () => void;
	removable?: boolean;
};

export default function TraitBadge({ label, onClick, removable }: Props) {
	const base = "flex items-center gap-1 px-3 py-1 transition-colors";
	const active =
		"bg-muted dark:bg-muted/10 text-accent-foreground/80 hover:bg-muted-foreground/15";
	const suggested =
		"bg-gray-100 dark:bg-gray-100/10 text-gray-700 dark:text-white hover:bg-gray-200";

	return (
		<Badge
			variant="secondary"
			onClick={onClick}
			className={`${base} ${removable ? active : suggested} select-none ${
				onClick ? "cursor-pointer" : ""
			}`}
		>
			{label}
			{removable && (
				<button
					type="button"
					onClick={onClick}
					className="ml-1 cursor-pointer hover:text-accent-foreground"
				>
					<X className="h-3 w-3" />
				</button>
			)}
		</Badge>
	);
}
