"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Loader2, Pin, PinOff, Share, Split, X } from "lucide-react";
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
import useSessionId from "@/stores/use-session";
import { useShareModalStore } from "@/stores/use-share-modal";
import { useSession } from "@/lib/auth-client";

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

	const { reset } = useSessionId();
	const { open: openDeleteModal, setChat: setDeleteModalChat } =
		useDeleteChatModal();
	const { open: openShareModal, setChat: setShareModalChat } =
		useShareModalStore();
	const { data: sessionData } = useSession();
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

		if (!sessionData) return;
		updateChatData({
			id: chat._id,
			isPinned: !chat.isPinned,
			sessionToken: sessionData.session.token,
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
					"relative w-full justify-start overflow-hidden dark:text-accent-foreground!",
					!isEditing && highlighted && "shadow-none"
				)}
				variant={!isEditing && !highlighted ? "ghost" : "secondary"}
				asChild
			>
				<Link
					href={`/chat/${chat._id}`}
					className="flex justify-start items-center w-full group"
					onClick={() => {
						reset();
					}}
					onDoubleClick={(e) => {
						e.preventDefault();
						onStartEdit(chat._id, chat.title || "");
					}}
				>
					{!isEditing ? (
						<div
							className={cn(
								"absolute bg-gradient-to-r pointer-events-none from-accent/0 z-5 via-accent w-4/5 to-accent h-full top-0 right-0 flex p-1 items-center justify-end transition-transform ease-in-out duration-150",
								isHovering ? "translate-x-0" : "translate-x-full"
							)}
						>
							<Button
								size="icon"
								variant="ghost"
								className="size-7 hover:bg-foreground/10 dark:hover:bg-accent-foreground/10 pointer-events-auto"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setShareModalChat(chat);
									openShareModal();
								}}
							>
								<Share />
							</Button>
							<Button
								size="icon"
								variant="ghost"
								className="size-7 hover:bg-foreground/10 dark:hover:bg-accent-foreground/10 pointer-events-auto"
								onClick={togglePin}
							>
								{chat.isPinned ? <PinOff /> : <Pin />}
							</Button>
							<Button
								size="icon"
								variant="ghost"
								className="size-7 hover:bg-highlight-background hover:text-highlight-foreground dark:hover:text-highlight-foreground dark:hover:bg-highlight-background pointer-events-auto"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setDeleteModalChat(chat);
									openDeleteModal();
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
										className="p-0 cursor-pointer opacity-70 hover:opacity-100"
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
