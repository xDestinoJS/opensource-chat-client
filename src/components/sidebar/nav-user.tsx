"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		image?: string | undefined | null;
	};
}) {
	user.image = user.image ?? "";

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					asChild
				>
					<Link href="/chat">
						<Avatar className="h-8 w-8 rounded-full">
							<AvatarImage src={user.image} alt={user.name} />
							<AvatarFallback className="rounded-full">
								{user.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="truncate text-xs">Free</span>
						</div>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
