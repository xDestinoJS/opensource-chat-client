"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsPages } from "../layout";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export default function SettingsRow({ pages }: { pages: SettingsPages }) {
	const pathname = usePathname();

	// Find current page name
	const activePage = pages.find((page) => page.href === pathname);
	const currentPage = activePage ? activePage.name : "Settings";

	return (
		<>
			{/* Mobile view (visible below sm breakpoint) */}
			<div className="sm:hidden w-full p-1 rounded-lg bg-muted/60 dark:bg-muted/10">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="w-full justify-between text-base"
						>
							<span>{currentPage}</span>
							<ChevronDown className="h-4 w-4 opacity-50" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-[200px] w-[var(--radix-dropdown-menu-trigger-width)]"
						align="center"
						sideOffset={4}
					>
						{pages.map((page) => (
							<DropdownMenuItem key={page.name} asChild>
								<Button
									className="w-full justify-start text-base"
									variant="ghost"
									size="lg"
									asChild
								>
									<Link
										href={page.href}
										className={pathname === page.href ? "font-bold" : ""}
									>
										{page.name}
									</Link>
								</Button>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Desktop view (visible from sm breakpoint and up) */}
			<div className="hidden sm:flex flex-wrap gap-0.75 p-0.75 w-max h-max rounded-lg bg-[#f2cbe9] dark:bg-[#312836]">
				{pages.map((page) => (
					<Button
						key={page.name}
						variant="ghost"
						size="sm"
						className={cn(
							"w-max rounded-md text-sm",
							pathname === page.href ? "bg-gradient-top text-foreground" : ""
						)}
						asChild
					>
						<Link href={page.href}>{page.name}</Link>
					</Button>
				))}
			</div>
		</>
	);
}
