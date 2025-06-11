"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Split } from "lucide-react";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatTitleDisplay } from "./chat-title-display";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { AutosizeTextAreaRef } from "../ui/autosize-textarea";

type ChatDoc = Doc<"chats">;

export interface ChatListItemProps {
	chat: ChatDoc;
	isEditing: boolean;
	animateOnAppear: boolean;
	branchData?: ChatDoc;
	onStartEdit: (chatId: Id<"chats">, currentTitle: string) => void;
	onUpdateTitle: () => void;
	onEditKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	editInputAreaRef: React.RefObject<HTMLInputElement | null>;
	onNavigateToBranch: (branchId: Id<"chats">) => void;
}

export const ChatListItem = React.memo(function ChatListItem({
	chat,
	isEditing,
	animateOnAppear,
	branchData,
	onStartEdit,
	onUpdateTitle,
	onEditKeyDown,
	editInputAreaRef,
	onNavigateToBranch,
}: ChatListItemProps) {
	const handleBranchClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent Link's navigation
		if (branchData) {
			onNavigateToBranch(branchData._id);
		}
	};

	useEffect(() => {
		if (isEditing && editInputAreaRef.current) {
			editInputAreaRef.current.focus();
			editInputAreaRef.current.select(); // Select the text for easier editing
		}
	}, [isEditing]);

	return (
		<SidebarMenuItem>
			<Button
				className="w-full justify-start"
				variant={!isEditing ? "ghost" : "secondary"}
				asChild
			>
				<Link
					href={`/chat/${chat._id}`}
					className="flex justify-start items-center w-full"
					onDoubleClick={(e) => {
						e.preventDefault();
						onStartEdit(chat._id, chat.title || "");
					}}
				>
					<div className="flex w-full gap-2 h-full items-center">
						{branchData && (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="p-0 cursor-pointer"
										onClick={handleBranchClick}
										aria-label={`Navigate to branched chat: ${branchData.title}`}
									>
										<Split />
									</button>
								</TooltipTrigger>
								<TooltipContent>
									Branched from: {branchData.title}
								</TooltipContent>
							</Tooltip>
						)}

						{isEditing ? (
							<input
								ref={editInputAreaRef}
								type="text"
								defaultValue={chat.title}
								onBlur={onUpdateTitle}
								onKeyDown={onEditKeyDown}
								autoFocus
								className="w-full bg-transparent border-none outline-none"
								onClick={(e) => e.preventDefault()} // Prevent Link navigation when clicking input
							/>
						) : (
							<ChatTitleDisplay chat={chat} animateOnAppear={animateOnAppear} />
						)}
					</div>
				</Link>
			</Button>
		</SidebarMenuItem>
	);
});
ChatListItem.displayName = "ChatListItem";
