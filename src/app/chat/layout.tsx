import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import DeleteChatModal from "@/components/modals/delete-chat-modal";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-full h-screen">{children}</main>

			{/* Modals */}
			<DeleteChatModal />
		</SidebarProvider>
	);
}
