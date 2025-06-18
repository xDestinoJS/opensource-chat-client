"use client";

import { FormDescription, FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export default function SettingsItem({
	title,
	subtitle,
	description,
	children,
	icon,
	size = "lg",
	row = false,
	form = false,
}: {
	title: string;
	subtitle?: string;
	description?: string;
	icon?: LucideIcon;
	children: React.ReactNode;
	size?: "sm" | "lg";
	row?: boolean;
	form?: boolean;
}) {
	const Icon = icon as LucideIcon;

	return (
		<div className={cn("flex flex-wrap sm:flex-nowrap w-full gap-2.5")}>
			{Icon && <Icon className="hidden sm:block" />}

			<div
				className={cn(
					"flex flex-col gap-3 w-full",
					row ? "flex-row justify-center items-center" : "flex-wrap"
				)}
			>
				<div className="grow">
					<h1
						className={cn(
							"flex gap-2 items-center",
							`${
								size == "sm"
									? "text-base text-primary/95"
									: "font-semibold text-[1.6rem] font-secondary sm:mt-[-5px]"
							}`
						)}
					>
						{Icon && <Icon className="block sm:hidden" />}
						{title}{" "}
						{subtitle && (
							<span className="text-xs text-muted-foreground">{subtitle}</span>
						)}
						{form && <FormLabel className="sr-only">{title}</FormLabel>}
					</h1>

					{description ? (
						<>
							<p
								className={cn(
									"text-muted-foreground",
									`${size == "sm" ? "text-sm mt-1" : "text-base"}`
								)}
							>
								{description}
							</p>
							{form && (
								<FormDescription className="sr-only">
									{description}
								</FormDescription>
							)}
						</>
					) : null}
				</div>

				<div className={!row ? "w-full" : ""}>{children}</div>
			</div>
		</div>
	);
}
