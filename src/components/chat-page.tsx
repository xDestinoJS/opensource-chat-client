"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useEffect, useRef } from "react";

import MessagePair from "@/components/chat/message-pair";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { redirect } from "next/navigation";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "./ui/button";
import { AutosizeTextarea, AutosizeTextAreaRef } from "./ui/autosize-textarea";
import chunkArray from "@/utils/chunk-array";
import { useChatInputEvents } from "@/hooks/useChatInputEvents";
import { useChatScrollManagement } from "@/hooks/useChatScrollManagement";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import useChatModel from "@/hooks/useChatModel";
import models from "@/lib/models";
import Image from "next/image";

export default function ChatPage({ chatId }: { chatId?: string }) {
	const chat = (chatId
		? useQuery(api.chat.getChat, {
				chatId: chatId as Id<"chats">,
			})
		: null) ?? { title: "" };

	const messages =
		(chatId
			? useQuery(api.messages.listMessages, {
					chatId: chatId as Id<"chats">,
				})
			: null) ?? [];

	const pairedMessages = useMemo(() => chunkArray(messages, 2), [messages]);

	const sendMessage = useMutation(api.messages.sendMessage);

	const branchMessage = useMutation(api.messages.branchMessage);
	const editMessage = useMutation(api.messages.editMessage);
	const retryMessage = useMutation(api.messages.retryMessage);
	const cancelMessage = useMutation(api.messageCancellations.cancelMessage);

	const inputAreaRef = useRef<AutosizeTextAreaRef>(null);

	const blankSpaceRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const lastPairContainerRef = useRef<HTMLDivElement>(null);

	// Get model
	const { modelId, setModelId } = useChatModel();

	// Use the custom hook for input events
	useChatInputEvents(inputAreaRef);

	// Use the custom hook for scroll management
	useChatScrollManagement(
		lastPairContainerRef,
		blankSpaceRef,
		scrollContainerRef,
		messages
	);

	useEffect(() => {
		if (typeof document === "undefined") return;
		document.title = chat.title || "Chat";
	}, [chat]);

	async function handleSubmit() {
		const currentInput = inputAreaRef.current?.textArea.value.trim();
		if (!currentInput) return;

		// Send message to the server
		(async () => {
			const response = await sendMessage({
				content: currentInput,
				chatId: chatId as Id<"chats">,
				model: modelId,
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

	return (
		<main className="flex flex-col items-center justify-center w-full h-full">
			<div
				ref={scrollContainerRef}
				className="flex w-full justify-center grow min-h-0 overflow-y-scroll pb-4 pt-8"
			>
				<div className="flex flex-col gap-2 w-full max-w-3xl px-4">
					{pairedMessages?.map((chunk, index) => {
						const isLastPair = pairedMessages.length - 1 === index;
						const userMessage = chunk[0]; // Always user first
						const assistantMessage = chunk[1]; // Assistant second (might be undefined)

						return (
							<MessagePair
								key={index}
								userMessage={userMessage}
								assistantMessage={assistantMessage}
								isLastPair={isLastPair}
								lastPairContainerRef={lastPairContainerRef}
								onEditMessage={(messageId, content) => {
									editMessage({
										messageId,
										content,
									});
								}}
								onRetryMessage={(messageId) => {
									retryMessage({
										messageId,
									});
								}}
								onBranchMessage={async (messageId) => {
									const response = await branchMessage({
										messageId,
									});
									redirect("/chat/" + response.chatId);
								}}
							/>
						);
					})}
					<div ref={blankSpaceRef} />
				</div>
			</div>

			<form className="bg-gray-100 p-4 rounded-tl-2xl w-full max-w-3xl rounded-tr-2xl border border-neutral-300 shrink-0">
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
				<div className="flex justify-between items-center mt-2 bottom-0 right-0">
					<Select onValueChange={setModelId} value={modelId}>
						<SelectTrigger className="w-[225px]">
							<SelectValue placeholder="Model" />
						</SelectTrigger>
						<SelectContent>
							{models.map((model) => {
								return (
									<SelectItem key={model.id} value={model.id}>
										<div className="flex items-center gap-0.75">
											<Image
												height={18}
												width={18}
												src={model.icon}
												alt={model.name}
											/>
											<span className="ml-2">{model.name}</span>
										</div>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>

					{messages?.length === 0 ||
					(messages && messages[messages.length - 1]?.isComplete) ? (
						<Button size="icon" type="button" onClick={handleSubmit}>
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
