"use client";

import React, { useState, useRef } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "./ui/button";
import { Pin, Plus } from "lucide-react";
import { ChatGroupSection } from "./chat/chat-group-section";

interface ChatGroup {
	label: string;
	chats: Doc<"chats">[];
}

interface GroupedChatsResult {
	pinnedChats: Doc<"chats">[];
	dateBasedGroups: ChatGroup[];
}

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

	const getChatGroups = (): GroupedChatsResult => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		const sevenDaysAgo = new Date(today);
		sevenDaysAgo.setDate(today.getDate() - 7);
		const thirtyDaysAgo = new Date(today);
		thirtyDaysAgo.setDate(today.getDate() - 30);

		const pinnedChats: Doc<"chats">[] = [];
		const unpinnedChats: Doc<"chats">[] = [];

		chats.forEach((chat) => {
			// Assuming chat objects have a 'pinned' boolean property
			if (chat.isPinned) {
				pinnedChats.push(chat);
			} else {
				unpinnedChats.push(chat);
			}
		});

		// Sort pinned chats by creation time, newest first
		pinnedChats.sort((a, b) => b._creationTime - a._creationTime);

		const groups: Record<string, Doc<"chats">[]> = {
			Today: [],
			Yesterday: [],
			"Last 7 Days": [],
			"Last 30 Days": [],
			Older: [],
		};

		unpinnedChats.forEach((chat) => {
			const chatDate = new Date(chat._creationTime);
			if (chatDate >= today) {
				groups.Today.push(chat);
			} else if (chatDate >= yesterday) {
				groups.Yesterday.push(chat);
			} else if (chatDate >= sevenDaysAgo) {
				groups["Last 7 Days"].push(chat);
			} else if (chatDate >= thirtyDaysAgo) {
				groups["Last 30 Days"].push(chat);
			} else {
				groups.Older.push(chat);
			}
		});

		const dateBasedGroups = Object.entries(groups)
			.map(([label, groupedChats]) => ({
				label,
				chats: groupedChats.sort((a, b) => b._creationTime - a._creationTime), // Sort within groups, newest first
			}))
			.filter((group) => group.chats.length > 0);

		return { pinnedChats, dateBasedGroups };
	};

	const { pinnedChats, dateBasedGroups } = getChatGroups();

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
				<ChatGroupSection
					label="Pinned"
					chats={pinnedChats}
					allChats={chats}
					editingChatId={editingChatId}
					isRecentlyCreated={isRecentlyCreated}
					updateTitle={updateTitle}
					handleEditKeyDown={handleEditKeyDown}
					editInputAreaRef={editInputAreaRef}
					setEditingChatId={setEditingChatId}
					Icon={Pin}
				/>
				{dateBasedGroups.map((group) => (
					<ChatGroupSection
						key={group.label}
						label={group.label}
						chats={group.chats}
						allChats={chats}
						editingChatId={editingChatId}
						isRecentlyCreated={isRecentlyCreated}
						updateTitle={updateTitle}
						handleEditKeyDown={handleEditKeyDown}
						editInputAreaRef={editInputAreaRef}
						setEditingChatId={setEditingChatId}
					/>
				))}
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
