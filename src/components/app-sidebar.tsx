"use client";

import React, { useState, useRef } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { ChatListItem } from "./chat/chat-list-item";

export function AppSidebar() {
	const [editingChatId, setEditingChatId] = useState<Id<"chats"> | null>(null);

	const editInputAreaRef = useRef<HTMLInputElement>(null);

	const chats = useQuery(api.chat.listChats) ?? [];
	const updateChatData = useMutation(api.chat.updateChatData);

	const isRecentlyCreated = (creationTime: number) => {
		const tenSecondsAgo = Date.now() - 10000; // 10 seconds threshold
		return creationTime > tenSecondsAgo;
	};

	function updateTitle() {
		if (editingChatId && editInputAreaRef.current) {
			const editText = editInputAreaRef.current.value.trim();
			if (editText != "") {
				updateChatData({
					id: editingChatId,
					title: editInputAreaRef.current?.value,
				});
			}
		}
		setEditingChatId(null);
	}

	function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			updateTitle();
		} else if (e.key === "Escape") {
			setEditingChatId(null);
		}
	}

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
								const animateOnAppearForDisplay = chat.title
									? isRecentlyCreated(chat._creationTime)
									: false;

								const branchData = chat.branchOf
									? chats.find((c) => c._id === chat.branchOf)
									: undefined;

								return (
									<ChatListItem
										key={chat._id}
										chat={chat}
										isEditing={editingChatId === chat._id}
										animateOnAppear={animateOnAppearForDisplay}
										branchData={branchData}
										onStartEdit={() => setEditingChatId(chat._id)}
										onUpdateTitle={updateTitle}
										onEditKeyDown={handleEditKeyDown}
										editInputAreaRef={editInputAreaRef}
										onNavigateToBranch={() =>
											redirect(`/chat/${chat.branchOf}`)
										}
									/>
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
