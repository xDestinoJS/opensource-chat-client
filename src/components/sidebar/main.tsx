"use client";

import React, { useState, useRef } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "../ui/button";
import { Pin } from "lucide-react";
import { ChatGroupSection } from "./chat-group-section";
import { useSession } from "@/lib/auth-client";
import { NavUser } from "./nav-user";
import SearchInput from "./search-input";
import { cn } from "@/lib/utils";
import QuickActions from "./quick-actions";

interface ChatGroup {
	label: string;
	chats: Doc<"chats">[];
}

interface GroupedChatsResult {
	pinnedChats: Doc<"chats">[];
	dateBasedGroups: ChatGroup[];
}

export function AppSidebar() {
	const { data: session } = useSession();
	const [editingChatId, setEditingChatId] = useState<Id<"chats"> | null>(null);
	const [query, setQuery] = useState(""); // State for the search query

	const editInputAreaRef = useRef<HTMLInputElement>(null);

	const allChats = useQuery(api.chat.listChats) ?? []; // Renamed to allChats for clarity

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

	// Modified getChatGroups to accept chats as an argument
	const getChatGroups = (chatsToGroup: Doc<"chats">[]): GroupedChatsResult => {
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

		chatsToGroup.forEach((chat) => {
			// Use chatsToGroup here
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

	const normalizedQuery = query.toLowerCase();
	const matchingChats = allChats.filter((chat) =>
		chat.title.toLowerCase().includes(normalizedQuery)
	);

	const { pinnedChats, dateBasedGroups } = getChatGroups(matchingChats);

	return (
		<Sidebar className="duration-250 ease-in-out">
			<SidebarHeader className="p-3">
				<div className="flex justify-between items-center">
					<QuickActions />
					<p className="mt-1">Chat</p>
					<div className="size-7"></div>
				</div>
				<Button size="lg" className="w-full" asChild>
					<Link href="/chat">New Chat</Link>
				</Button>

				<SearchInput query={query} setQuery={setQuery} />
			</SidebarHeader>
			<SidebarContent>
				{/* Pass allChats (unfiltered) to ChatGroupSection if it needs access to the complete list for actions */}
				<ChatGroupSection
					label="Pinned"
					chats={pinnedChats} // These are already filtered and grouped
					allChats={allChats} // Keep this as the full list for operations like pinning/unpinning
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
						chats={group.chats} // These are already filtered and grouped
						allChats={allChats} // Keep this as the full list for operations like pinning/unpinning
						editingChatId={editingChatId}
						isRecentlyCreated={isRecentlyCreated}
						updateTitle={updateTitle}
						handleEditKeyDown={handleEditKeyDown}
						editInputAreaRef={editInputAreaRef}
						setEditingChatId={setEditingChatId}
					/>
				))}
			</SidebarContent>
			{session?.user && (
				<SidebarFooter>
					<NavUser user={session.user} />
				</SidebarFooter>
			)}
		</Sidebar>
	);
}
