import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/main";
import DeleteChatModal from "@/components/modals/delete-chat-modal";
import SpotlightModal from "@/components/modals/spotlight-modal";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-full h-screen">{children}</main>

			{/* Modals */}
			<DeleteChatModal />
			<SpotlightModal />
		</SidebarProvider>
	);
}
