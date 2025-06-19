"use client";

import { useSearchParams } from "next/navigation";
import ChatPage from "../../components/chat/chat-page";
import { Id } from "../../../convex/_generated/dataModel";

export default function Page() {
	const searchParams = useSearchParams();
	const agentId = searchParams.get("agentId");

	return <ChatPage agentId={(agentId ?? "") as Id<"agents">} />;
}
