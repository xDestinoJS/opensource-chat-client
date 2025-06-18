"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useDeleteChatModal } from "@/stores/use-delete-chat-modal";
import { useSession } from "@/lib/auth-client";

export default function DeleteChatModal() {
	const { data: sessionData } = useSession();
	const { isOpen, close, chat } = useDeleteChatModal();
	const deleteChat = useMutation(api.chat.deleteChat);

	return (
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent showCloseButton={false} className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Delete Chat</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete &quot;{chat?.title}&quot;? This
						action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="ghost">Cancel</Button>
					</DialogClose>
					<Button
						variant="destructive"
						onClick={async () => {
							if (chat && sessionData) {
								close();
								deleteChat({
									id: chat._id,
									sessionToken: sessionData.session.token,
								});
							}
						}}
					>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
