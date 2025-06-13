"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useEffect, useRef, useState } from "react";

import MessagePair from "@/components/chat/message-pair";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { redirect } from "next/navigation";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "../ui/button";
import { AutosizeTextarea, AutosizeTextAreaRef } from "../ui/autosize-textarea";
import chunkArray from "@/utils/chunk-array";
import { useChatInputEvents } from "@/hooks/useChatInputEvents";
import { useChatScrollManagement } from "@/hooks/useChatScrollManagement";
import useChatModels from "@/hooks/useChatModels";
import { TextQuote } from "../text-quote";
import useSessionId from "@/stores/use-session";
import ModelDropdown from "./model-dropdown/main";

export default function ChatPage({ chatId }: { chatId?: Id<"chats"> }) {
	const { sessionId } = useSessionId();

	const [quote, setQuote] = useState<string | undefined>();
	const [mounted, setMounted] = useState(false);

	// If chatId is not of a real chat, we redirect to the chat page
	if (chatId) {
		try {
			useQuery(api.chat.getChat, { chatId });
		} catch (error) {
			redirect("/chat");
		}
	}

	const chat = (chatId ? useQuery(api.chat.getChat, { chatId }) : null) ?? null;
	const messages =
		(chatId
			? useQuery(api.messages.listMessages, {
					chatId: chatId,
					excludeSession: sessionId,
				})
			: null) ?? [];

	const pairedMessages = useMemo(() => chunkArray(messages, 2), [messages]);

	const sendMessage = useMutation(api.messages.sendMessage);

	const branchMessage = useMutation(api.messages.branchMessage);
	const editMessage = useMutation(api.messages.editMessage);
	const retryMessage = useMutation(api.messages.retryMessage);
	const cancelMessage = useMutation(api.messages.cancelMessage);

	const inputAreaRef = useRef<AutosizeTextAreaRef>(null);

	const inputContainerRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const lastPairContainerRef = useRef<HTMLDivElement>(null);

	const { modelId, providersList, setModelId } = useChatModels();

	// Use the custom hook for input events
	useChatInputEvents(inputAreaRef);

	// Use the custom hook for scroll management
	useChatScrollManagement(
		lastPairContainerRef,
		inputContainerRef,
		scrollContainerRef,
		messages
	);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted)
			document.title = chat?.title ? `${chat.title} - ChatApp` : "ChatApp";
	}, [chat, mounted]);

	async function handleSubmit() {
		const currentInput = inputAreaRef.current?.textArea.value.trim();
		if (!currentInput || chat?.isAnswering) return;

		// Send message to the server
		(async () => {
			const response = await sendMessage({
				quote: quote,
				content: currentInput,
				chatId: chatId as Id<"chats">,
				model: modelId,
				sessionId,
			});

			setQuote(undefined); // Clear the quote after sending

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
		<main className="flex flex-col items-center justify-center flex-1 h-screen">
			<div
				ref={scrollContainerRef}
				className="flex w-full justify-center grow min-h-0 overflow-y-scroll pb-4 pt-8"
			>
				<div className="flex flex-col gap-2 w-full max-w-3xl max-lg:px-8 px-4">
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
										sessionId,
										messageId,
										content,
									});
								}}
								onRetryMessage={(messageId) => {
									retryMessage({
										sessionId,
										messageId,
									});
								}}
								onBranchMessage={async (messageId) => {
									const response = await branchMessage({
										messageId,
									});
									redirect("/chat/" + response.chatId);
								}}
								onQuote={setQuote}
							/>
						);
					})}
				</div>
			</div>
			<form className="w-full max-w-3xl max-lg:px-4 shrink-0">
				<div
					ref={inputContainerRef}
					className="bg-neutral-50 p-4 rounded-tl-2xl rounded-tr-2xl  border border-neutral-300"
				>
					{quote && (
						<TextQuote
							quote={quote}
							variant="foreground"
							onRemove={() => setQuote(undefined)}
						/>
					)}
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
						<ModelDropdown
							modelId={modelId}
							providersList={providersList}
							setModelId={setModelId}
						/>

						{messages?.length === 0 || !chat?.isAnswering ? (
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
								<Square className="fill-secondary" />
							</Button>
						)}
					</div>
				</div>
			</form>
		</main>
	);
}
