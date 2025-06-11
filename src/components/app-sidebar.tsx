"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

export function AppSidebar() {
	const { open } = useSidebar();
	const chats = useQuery(api.chat.listChats) ?? [];

	return (
		<Sidebar className="duration-250 ease-in-out">
			<SidebarHeader>
				<div className="flex justify-between items-center">
					<div className="size-7">
						<SidebarTrigger className="fixed top-2 left-2" />
					</div>
					<p className="mt-1">Chat</p>
					<Button size="icon" variant="ghost" className="size-7" asChild>
						<Link href="/chat">
							<Plus />
						</Link>
					</Button>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Chats</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{chats.map((chat) => (
								<SidebarMenuItem key={chat._id}>
									<SidebarMenuButton asChild>
										<Link href={`/chat/${chat._id}`}>
											<span className="text-sm font-medium">{chat.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
