"use client";

import React from "react";
import { motion } from "framer-motion";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Doc, Id } from "../../../convex/_generated/dataModel";

type ChatDoc = Doc<"chats">;

export interface ChatTitleDisplayProps {
	chat: ChatDoc;
	animateOnAppear: boolean;
}

export const ChatTitleDisplay = React.memo(function ChatTitleDisplay({
	chat,
	animateOnAppear,
}: ChatTitleDisplayProps) {
	return (
		<div className="w-full h-full overflow-hidden whitespace-nowrap text-ellipsis">
			<Tooltip>
				<TooltipTrigger asChild>
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
					>
						{chat.title}
					</motion.span>
				</TooltipTrigger>
				<TooltipContent>{chat.title}</TooltipContent>
			</Tooltip>
		</div>
	);
});
ChatTitleDisplay.displayName = "ChatTitleDisplay";
