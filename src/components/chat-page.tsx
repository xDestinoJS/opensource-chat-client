"use client";

import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

import UserMessage from "@/components/chat/messages/user-message";
import AssistantMessage from "@/components/chat/messages/assistant-message";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { redirect } from "next/navigation";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "./ui/button";
import { AutosizeTextarea, AutosizeTextAreaRef } from "./ui/autosize-textarea";
import chunkArray from "@/utils/chunk-array";
import clamp from "@/utils/clamp";

export default function ChatPage({ chatId }: { chatId?: string }) {
	const messages =
		(!chatId
			? []
			: useQuery(api.messages.listMessages, {
					chatId: chatId as Id<"chats">,
				})) ?? [];

	const pairedMessages = chunkArray(messages, 2);

	const sendMessage = useMutation(api.messages.sendMessage);

	const branchMessage = useMutation(api.messages.branchMessage);
	const editMessage = useMutation(api.messages.editMessage);
	const retryMessage = useMutation(api.messages.retryMessage);
	const cancelMessage = useMutation(api.messageCancellations.cancelMessage);

	const inputAreaRef = useRef<AutosizeTextAreaRef>(null);

	const blankSpaceRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const lastPairContainerRef = useRef<HTMLDivElement>(null);

	async function handleSubmit() {
		const currentInput = inputAreaRef.current?.textArea.value.trim();
		if (!currentInput) return;

		// Send message to the server
		(async () => {
			const response = await sendMessage({
				content: currentInput,
				chatId: chatId as Id<"chats">,
				model: "mistral-small",
			});

			// If the chatId is not provided, we redirect to the chat page
			if (messages?.length === 0) {
				redirect("/chat/" + response?.chatId);
			}
		})();

		if (inputAreaRef.current) {
			inputAreaRef.current.textArea.value = "";
			inputAreaRef.current.textArea.focus();
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
				inputAreaRef.current?.textArea.focus();
			}
		};

		const handlePaste = (event: ClipboardEvent) => {
			if (document.activeElement !== inputAreaRef.current?.textArea) {
				// Check specific element
				inputAreaRef.current?.textArea.focus();
				return;
			}

			event.preventDefault();
			const text = event.clipboardData?.getData("text");
			if (text && inputAreaRef.current) {
				inputAreaRef.current.textArea.value += text;
				// Move the cursor to the end of the text
				inputAreaRef.current.textArea.selectionStart =
					inputAreaRef.current.textArea.selectionEnd =
						inputAreaRef.current.textArea.value.length;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("paste", handlePaste);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("paste", handlePaste);
		};
	}, []);

	useEffect(() => {
		const lastPairNode = lastPairContainerRef.current;
		const blankSpaceNode = blankSpaceRef.current;
		const scrollNode = scrollContainerRef.current;

		const updateBlankSpace = () => {
			if (lastPairNode && blankSpaceNode && scrollNode) {
				const scrollHeight = scrollNode.clientHeight;
				const lastPairHeight = lastPairNode.offsetHeight;

				blankSpaceNode.style.paddingTop = `${scrollHeight - lastPairHeight - 16}px`;
			}
		};

		updateBlankSpace();

		window.addEventListener("resize", updateBlankSpace);

		return () => {
			window.removeEventListener("resize", updateBlankSpace);
		};
	}, [messages]);

	return (
		/* TODO: CHANGE h-screen TO h-full later on */
		<main className="flex flex-col items-center justify-center w-full h-screen p-4">
			<div
				ref={scrollContainerRef}
				className="flex w-full justify-center grow min-h-0 overflow-y-scroll pb-4"
			>
				<div className="flex flex-col gap-2 w-full max-w-3xl">
					{pairedMessages?.map((chunk, index) => {
						const isLastPair = pairedMessages.length - 1 === index;

						return (
							<div
								key={index}
								ref={isLastPair ? lastPairContainerRef : null}
								className={isLastPair ? "pb-4" : undefined}
							>
								{chunk.map((message) => {
									const content = message.content.join("");

									return (
										<div key={message._id} className="flex w-full">
											<div
												className={cn(
													"w-full",
													message.role === "user"
														? "justify-end"
														: "justify-start"
												)}
											>
												{message.role === "user" ? (
													<UserMessage
														message={message}
														content={content}
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
														content={content}
														onBranch={async () => {
															const response = await branchMessage({
																messageId: message._id,
															});

															redirect("/chat/" + response.chatId);
														}}
														onRetry={() => {
															retryMessage({
																messageId: message._id,
															});
														}}
													/>
												)}
											</div>
										</div>
									);
								})}
							</div>
						);
					})}
					<div ref={blankSpaceRef} />
				</div>
			</div>

			<form
				onSubmit={handleSubmit}
				className="bg-gray-100 p-4 rounded-2xl border w-3xl border-neutral-300 shrink-0"
			>
				<AutosizeTextarea
					ref={inputAreaRef}
					name="prompt"
					type="transparent"
					maxHeight={170}
					className="w-full focus:outline-none resize-none bg-transparent"
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSubmit();
							return;
						}
					}}
				/>
				<div className="flex justify-end mt-2 bottom-0 right-0">
					{messages?.length === 0 ||
					(messages && messages[messages.length - 1]?.isComplete) ? (
						<Button size="icon" type="submit" onClick={handleSubmit}>
							<ArrowUp />
						</Button>
					) : (
						<Button
							size="icon"
							type="button"
							onClick={async () => {
								await cancelMessage({
									chatId: chatId as Id<"chats">,
								});
								return;
							}}
						>
							<Square />
						</Button>
					)}
				</div>
			</form>
		</main>
	);
}
