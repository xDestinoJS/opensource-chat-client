"use client";

import { useParams } from "next/navigation";
import ChatPage from "../../../components/chat/chat-page";
import { Id } from "../../../../convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";

export default function Page() {
	const { chatId } = useParams();

	return <ChatPage chatId={chatId as Id<"chats">} />;
}
