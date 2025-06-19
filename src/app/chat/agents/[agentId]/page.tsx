"use client";

import { useParams } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";
import ChatPage from "@/components/chat/chat-page";

export default function Page() {
	const { agentId } = useParams();

	return <ChatPage agentId={agentId as Id<"agents">} />;
}
