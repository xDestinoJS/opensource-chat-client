"use client";

import React, { useState, useCallback } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "./ui/button";
import { Split, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { redirect } from "next/navigation";

type ChatDoc = Doc<"chats">;

interface ChatTitleDisplayProps {
	chat: ChatDoc;
	animateOnAppear: boolean;
	onStartEdit: (chatId: Id<"chats">, currentTitle: string) => void;
}

const ChatTitleDisplay = React.memo(function ChatTitleDisplay({
	chat,
	animateOnAppear,
	onStartEdit,
}: ChatTitleDisplayProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="w-full h-full overflow-hidden whitespace-nowrap text-ellipsis">
					<motion.span
						className="w-full h-full"
						initial={{
							width: animateOnAppear ? 0 : "100%",
							opacity: animateOnAppear ? 0 : 1,
						}}
						animate={{
							width: chat.title ? "100%" : 0,
							opacity: chat.title ? 1 : 0,
						}}
						transition={{
							duration: animateOnAppear ? 0.3 : 0,
						}}
						onDoubleClick={(e) => {
							e.preventDefault();
							onStartEdit(chat._id, chat.title || "");
						}}
					>
						{chat.title}
					</motion.span>
				</div>
			</TooltipTrigger>
			<TooltipContent>{chat.title}</TooltipContent>
		</Tooltip>
	);
});
ChatTitleDisplay.displayName = "ChatTitleDisplay";

export function AppSidebar() {
	const [editingChatId, setEditingChatId] = useState<Id<"chats"> | null>(null);
	const [editText, setEditText] = useState<string>("");

	const chats = useQuery(api.chat.listChats) ?? [];
	const updateChatData = useMutation(api.chat.updateChatData);

	const isRecentlyCreated = (creationTime: number) => {
		const tenSecondsAgo = Date.now() - 10000; // 10 seconds threshold
		return creationTime > tenSecondsAgo;
	};

	const updateTitle = useCallback(() => {
		if (editingChatId && editText.trim() !== "") {
			updateChatData({ id: editingChatId, title: editText });
		}
		setEditingChatId(null);
		setEditText("");
	}, [editingChatId, editText, updateChatData, setEditingChatId, setEditText]);

	const handleStartEdit = useCallback(
		(chatId: Id<"chats">, currentTitle: string) => {
			setEditingChatId(chatId);
			setEditText(currentTitle);
		},
		[setEditingChatId, setEditText]
	);

	const handleEditKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				updateTitle();
			} else if (e.key === "Escape") {
				setEditingChatId(null);
				setEditText("");
			}
		},
		[updateTitle, setEditingChatId, setEditText]
	);

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

								const branchData = chats.find((c) => c._id === chat.branchOf);

								return (
									<SidebarMenuItem key={chat._id}>
										<Button
											className="w-full justify-start"
											variant="ghost"
											asChild
										>
											<Link
												href={`/chat/${chat._id}`}
												className="flex justify-start items-center w-full"
											>
												<div className="flex w-full gap-2 h-full items-center">
													{branchData && (
														<Tooltip>
															<TooltipTrigger asChild>
																<button
																	className="p-0 cursor-pointer"
																	onClick={(e) => {
																		e.preventDefault();
																		redirect(`/chat/${branchData._id}`);
																	}}
																>
																	<Split />
																</button>
															</TooltipTrigger>
															<TooltipContent>
																Branched from: {branchData.title}
															</TooltipContent>
														</Tooltip>
													)}

													{editingChatId !== chat._id ? (
														<ChatTitleDisplay
															chat={chat}
															animateOnAppear={animateOnAppearForDisplay}
															onStartEdit={handleStartEdit}
														/>
													) : (
														<input
															type="text"
															value={editText}
															onChange={(e) => setEditText(e.target.value)}
															onBlur={updateTitle}
															onKeyDown={handleEditKeyDown}
															autoFocus
															className="w-full bg-transparent border border-gray-400 dark:border-gray-600 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-foreground"
														/>
													)}
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
