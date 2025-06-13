"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Loader2, Pin, PinOff, Split, X } from "lucide-react";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatTitleDisplay } from "./chat-title-display";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import useHover from "@/hooks/useHover";
import { useDeleteChatModal } from "@/stores/use-delete-chat-modal";

type ChatDoc = Doc<"chats">;

export interface ChatListItemProps {
	chat: ChatDoc;
	isEditing: boolean;
	animateOnAppear: boolean;
	highlighted?: boolean;
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
	highlighted,
	branchData,
	onStartEdit,
	onUpdateTitle,
	onEditKeyDown,
	editInputAreaRef,
	onNavigateToBranch,
}: ChatListItemProps) {
	const [ref, isHovering] = useHover();

	const { open, setChat } = useDeleteChatModal();
	const updateChatData = useMutation(api.chat.updateChatData);

	const handleBranchClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent Link's navigation
		if (branchData) {
			onNavigateToBranch(branchData._id);
		}
	};

	function togglePin(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();
		e.stopPropagation();
		updateChatData({
			id: chat._id,
			isPinned: !chat.isPinned,
		});
	}

	useEffect(() => {
		if (isEditing && editInputAreaRef.current) {
			editInputAreaRef.current.focus();
			editInputAreaRef.current.select(); // Select the text for easier editing
		}
	}, [isEditing]);

	return (
		<SidebarMenuItem ref={ref}>
			<Button
				className={cn(
					"relative w-full justify-start overflow-hidden",
					!isEditing && highlighted && "shadow-none"
				)}
				variant={!isEditing && !highlighted ? "ghost" : "secondary"}
				asChild
			>
				<Link
					href={`/chat/${chat._id}`}
					className="flex justify-start items-center w-full group"
					onDoubleClick={(e) => {
						e.preventDefault();
						onStartEdit(chat._id, chat.title || "");
					}}
				>
					{!isEditing ? (
						<div
							className={cn(
								"absolute bg-gradient-to-r pointer-events-none from-secondary/0 z-5 via-secondary w-1/2 to-secondary h-full top-0 right-0 flex p-1 items-center justify-end transition-transform ease-in-out duration-150",
								isHovering ? "translate-x-0" : "translate-x-full"
							)}
						>
							<Button
								size="icon"
								variant="ghost"
								className="size-7 hover:bg-accent-foreground/10 pointer-events-auto"
								onClick={togglePin}
							>
								{chat.isPinned ? <PinOff /> : <Pin />}
							</Button>
							<Button
								size="icon"
								variant="ghost"
								className="size-7 hover:bg-destructive pointer-events-auto"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setChat(chat);
									open();
								}}
							>
								<X />
							</Button>
						</div>
					) : null}

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

						{chat.isAnswering && <Loader2 className="animate-spin" />}
					</div>
				</Link>
			</Button>
		</SidebarMenuItem>
	);
});
ChatListItem.displayName = "ChatListItem";
