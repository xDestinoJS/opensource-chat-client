"use client";

import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

import UserMessage from "@/components/chat/messages/user-message";
import AssistantMessage from "@/components/chat/messages/assistant-message";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { redirect } from "next/navigation";

export default function ChatPage({ chatId }: { chatId?: string }) {
	const messages = !chatId
		? []
		: useQuery(api.messages.listMessages, {
				chatId: chatId as Id<"chats">,
			});

	const sendMessage = useMutation(api.messages.sendMessage);
	const editMessage = useMutation(api.messages.editMessage);
	const retryMessage = useMutation(api.messages.retryMessage);

	const inputAreaRef = useRef<HTMLTextAreaElement>(null);

	async function handleSubmit() {
		const currentInput = inputAreaRef.current?.value.trim();
		if (!currentInput) return;

		// Send message to the server
		(async () => {
			const newChatId = await sendMessage({
				content: currentInput,
				chatId: chatId as Id<"chats">,
				model: "mistral-small",
			});

			// If the chatId is not provided, we redirect to the chat page
			if (messages?.length == 0) {
				redirect("/chat/" + newChatId);
			}
		})();

		if (inputAreaRef.current) {
			inputAreaRef.current.value = "";
			inputAreaRef.current.focus();
		}
	}

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isBasicKeyPress =
				event.key.length === 1 &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.altKey;
			const isEditableElement = document.activeElement?.matches(
				'input, textarea, [contenteditable="true"]'
			);

			if (isBasicKeyPress && !isEditableElement) {
				inputAreaRef.current?.focus();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<>
			<div className="flex flex-col gap-2">
				{messages?.map((message) => (
					<div key={message._id} className={"flex w-full"}>
						<div
							className={cn(
								"w-full",
								message.role == "user" ? "justify-end" : "justify-start"
							)}
						>
							{message.role == "user" ? (
								<UserMessage
									message={message}
									onEdit={(content) => {
										editMessage({
											messageId: message._id,
											content,
										});
									}}
									onRetry={() => {
										retryMessage({
											messageId: message._id,
										});
									}}
								/>
							) : (
								<AssistantMessage
									message={message}
									onBranch={() => alert("branching")}
									onRetry={() => {
										retryMessage({
											messageId: message._id,
										});
									}}
								/>
							)}
						</div>
					</div>
				))}
			</div>

			<form
				onSubmit={handleSubmit}
				className="bg-gray-100 p-4 rounded-2xl mt-4 border border-neutral-300"
			>
				<textarea
					ref={inputAreaRef}
					name="prompt"
					className="w-full focus:outline-none resize-none bg-transparent"
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSubmit();
							return;
						}
					}}
				/>
				<div className="flex justify-end mt-2">
					<button type="submit">Submit</button>
				</div>
			</form>
		</>
	);
}
