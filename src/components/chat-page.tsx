"use client";

import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import UserMessage from "@/components/chat/messages/user-message";
import AssistantMessage from "@/components/chat/messages/assistant-message";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
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
import { VariableSizeList as List } from "react-window";

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
	const listRef = useRef<List>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const itemSizes = useRef<Map<number, number>>(new Map());

	// Get model
	const { modelId, setModelId } = useChatModel();

	// Use the custom hook for input events
	useChatInputEvents(inputAreaRef);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (pairedMessages.length > 0 && listRef.current) {
			listRef.current.scrollToItem(pairedMessages.length - 1, "end");
		}
	}, [pairedMessages.length]);

	// Get item size with fallback
	const getItemSize = useCallback((index: number) => {
		return itemSizes.current.get(index) || 200; // Default height
	}, []);

	// Set item size when rendered
	const setItemSize = useCallback((index: number, size: number) => {
		if (itemSizes.current.get(index) !== size) {
			itemSizes.current.set(index, size);
			if (listRef.current) {
				listRef.current.resetAfterIndex(index);
			}
		}
	}, []);

	// Render individual message pair
	const renderMessagePair = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => {
			const chunk = pairedMessages[index];
			const isLastPair = pairedMessages.length - 1 === index;

			return (
				<div
					style={style}
					className={isLastPair ? "pb-4" : undefined}
					ref={(el) => {
						if (el) {
							const height = el.getBoundingClientRect().height;
							setItemSize(index, height);
						}
					}}
				>
					{chunk.map((message) => {
						const content = message.content.join("");

						return (
							<div key={message._id} className="flex w-full">
								<div
									className={cn(
										"w-full",
										message.role === "user" ? "justify-end" : "justify-start"
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
		},
		[pairedMessages, editMessage, retryMessage, branchMessage, setItemSize]
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
		/* TODO: CHANGE h-screen TO h-full later on */
		<main className="flex flex-col items-center justify-center w-full h-screen">
			<div
				ref={scrollContainerRef}
				className="flex w-full justify-center grow min-h-0 overflow-hidden py-4"
			>
				<div className="flex flex-col gap-2 w-full max-w-3xl px-4">
					{pairedMessages.length > 0 ? (
						<List
							ref={listRef}
							height={scrollContainerRef.current?.clientHeight || 600}
							itemCount={pairedMessages.length}
							itemSize={getItemSize}
							width="100%"
							style={{ width: "100%" }}
						>
							{renderMessagePair}
						</List>
					) : null}
				</div>
			</div>

			<form
				onSubmit={handleSubmit}
				className="bg-gray-100 p-4 rounded-tl-2xl w-full max-w-3xl rounded-tr-2xl border border-neutral-300 shrink-0"
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
				<div className="flex justify-between items-center mt-2 bottom-0 right-0">
					<Select onValueChange={setModelId} value={modelId}>
						<SelectTrigger className="w-[225px] h-full">
							<SelectValue placeholder="Model" />
						</SelectTrigger>
						<SelectContent>
							{models.map((model) => {
								return (
									<SelectItem key={model.id} value={model.id}>
										{model.name}
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
