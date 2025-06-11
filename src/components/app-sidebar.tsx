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
} from "@/components/ui/sidebar";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Button } from "./ui/button";
import { Split, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
	const chats = useQuery(api.chat.listChats) ?? [];

	const isRecentlyCreated = (creationTime: number) => {
		const fiveSecondsAgo = Date.now() - 10000; // 10 seconds threshold
		return creationTime > fiveSecondsAgo;
	};

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
							{chats.map((chat) => {
								const animate = chat.title
									? isRecentlyCreated(chat._creationTime)
									: false;
								return (
									<SidebarMenuItem key={chat._id}>
										<Button className="w-full" variant="ghost" asChild>
											<Link
												href={`/chat/${chat._id}`}
												className="flex items-center gap-2"
											>
												{chat.branchOf && (
													<button
														className="p-0 cursor-pointer"
														onClick={(e) => {
															e.preventDefault();
															redirect(`/chat/${chat.branchOf}`);
														}}
													>
														<Split />
													</button>
												)}

												<div className="w-full h-full overflow-hidden whitespace-nowrap text-ellipsis">
													<motion.span
														style={{
															display: "text-left inline-block",
															overflow: "hidden",
														}}
														initial={{
															width: animate ? 0 : "100%",
															opacity: animate ? 0 : 1,
														}}
														animate={{
															width: chat.title ? "100%" : 0,
															opacity: chat.title ? 1 : 0,
														}}
														transition={{
															type: "tween",
															duration: animate ? 0.3 : 0, // No animation if not recent
														}}
													>
														{chat.title ?? "New Chat"}
													</motion.span>
												</div>
											</Link>
										</Button>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
