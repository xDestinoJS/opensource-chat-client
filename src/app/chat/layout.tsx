"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/main";
import DeleteChatModal from "@/components/modals/delete-chat-modal";
import SpotlightModal from "@/components/modals/spotlight-modal";
import ShareModal from "@/components/modals/share-modal";
import Topbar from "@/components/chat/topbar";
import AgentModal from "@/components/modals/agent-modal";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="relative w-full h-screen">
				<Topbar />
				{children}
			</main>

			{/* Modals */}
			<DeleteChatModal />
			<AgentModal />
			<SpotlightModal />
			<ShareModal />
		</SidebarProvider>
	);
}
