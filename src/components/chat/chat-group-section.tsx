"use client";

import React from "react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
} from "@/components/ui/sidebar";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { ChatListItem } from "./chat-list-item";
import { redirect, useParams } from "next/navigation"; // Added for onNavigateToBranch

interface ChatGroupSectionProps {
	label: string;
	chats: Doc<"chats">[];
	allChats: Doc<"chats">[]; // To find branchData
	editingChatId: Id<"chats"> | null;
	isRecentlyCreated: (creationTime: number) => boolean;
	updateTitle: () => void;
	handleEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	editInputAreaRef: React.RefObject<HTMLInputElement | null>; // Allow null
	setEditingChatId: (id: Id<"chats"> | null) => void;
	// onNavigateToBranch: (chatId: Id<"chats">) => void; // Replaced with direct redirect usage for now
}

export function ChatGroupSection({
	label,
	chats,
	allChats,
	editingChatId,
	isRecentlyCreated,
	updateTitle,
	handleEditKeyDown,
	editInputAreaRef,
	setEditingChatId,
}: ChatGroupSectionProps) {
	const { chatId } = useParams();

	if (chats.length === 0) {
		return null;
	}

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{chats.map((chat) => {
						const animateOnAppearForDisplay = chat.title
							? isRecentlyCreated(chat._creationTime)
							: false;

						const branchData = chat.branchOf
							? allChats.find((c) => c._id === chat.branchOf)
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
								highlighted={chatId === chat._id}
								onNavigateToBranch={() => {
									if (chat.branchOf) {
										redirect(`/chat/${chat.branchOf}`);
									}
								}}
							/>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
