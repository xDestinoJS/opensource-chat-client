"use client";

import { CopyIcon, Link2Icon } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useShareModalStore } from "@/stores/use-share-modal";
import { useSession } from "@/lib/auth-client";
import copyToClipboard from "@/utils/copy-to-clipboard";
import { toast } from "sonner";

export default function ShareModal() {
	const [link, setLink] = useState("");
	const { data: sessionData } = useSession();
	const shareChat = useMutation(api.chat.shareChat);

	const { close, isOpen, chat } = useShareModalStore();

	useEffect(() => {
		setLink("");
	}, [chat]);

	async function generateShareLink() {
		if (link) {
			copyToClipboard(link);
			toast.success("Copied to clipboard");
			return;
		}

		if (!chat || !sessionData) return;

		const response = await shareChat({
			chatId: chat._id,
			sessionToken: sessionData.session.token,
		});

		setLink(window.location.origin + "/chat/" + response.chatId);
	}

	return (
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Share public link to chat</DialogTitle>
					<DialogDescription>
						Your name, custom instructions, and any messages you add after
						sharing stay private.
					</DialogDescription>
				</DialogHeader>

				<div className="flex w-full gap-2 rounded-lg">
					<Input className="grow h-full" value={link} readOnly />
					<Button onClick={generateShareLink} variant="highlight" size="lg">
						{link ? (
							<>
								<CopyIcon /> Copy link
							</>
						) : (
							<>
								<Link2Icon /> Create link
							</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
