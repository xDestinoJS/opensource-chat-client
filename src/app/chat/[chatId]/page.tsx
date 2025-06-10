"use client";

import { useParams } from "next/navigation";
import ChatPage from "../../../components/chat-page";

export default function Page() {
	const params = useParams();
	const chatId = params.chatId as string;

	return <ChatPage chatId={chatId} />;
}
