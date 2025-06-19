"use client";

import { useParams } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";
import ChatPage from "@/components/chat/chat-page";

export default function Page() {
	const { agentId, chatId } = useParams();
	return (
		<ChatPage
			chatId={chatId as Id<"chats">}
			agentId={agentId as Id<"agents">}
		/>
	);
}
