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
import { redirect } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useDeleteChatModal } from "@/stores/use-delete-chat-modal";

export default function DeleteChatModal() {
	const { isOpen, close, chat } = useDeleteChatModal();
	const deleteChat = useMutation(api.chat.deleteChat);

	return (
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent showCloseButton={false} className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Delete Chat</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete "{chat?.title}"? This action cannot
						be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="ghost">Cancel</Button>
					</DialogClose>
					<Button
						variant="destructive"
						onClick={async () => {
							if (chat) {
								close();
								deleteChat({
									id: chat._id,
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
