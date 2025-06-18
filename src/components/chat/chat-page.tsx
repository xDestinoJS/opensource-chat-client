"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useEffect, useRef, useState } from "react";

import MessagePair from "@/components/chat/message-pair";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { redirect, useRouter } from "next/navigation";
import { AutosizeTextAreaRef } from "../ui/autosize-textarea";
import chunkArray from "@/utils/chunk-array";
import { useChatInputEvents } from "@/hooks/useChatInputEvents";
import { useChatScrollManagement } from "@/hooks/useChatScrollManagement";
import useChatModels from "@/hooks/useChatModels";
import useSessionId from "@/stores/use-session";
import { ModelId } from "@/lib/providers";
import ChatInputForm from "./chat-input-form";
import { GenericFileData } from "@/lib/files";
import { useChatFeatures } from "@/stores/use-chat-features-store";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import SuggestionsContainer from "./suggestions/main";

export default function ChatPage({ chatId }: { chatId?: Id<"chats"> }) {
	const router = useRouter();

	const { sessionId } = useSessionId();
	const [quote, setQuote] = useState<string | undefined>();
	const [mounted, setMounted] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [areSuggestionsHidden, setAreSuggestionsHidden] = useState(false);
	const initiateUserPreferences = useMutation(
		api.userPreferences.initiateUserPreferences
	);

	const { data: sessionData, isPending } = useSession();
	const { isSearchEnabled, reasoningEffort } = useChatFeatures();

	// Always call useQuery at the top level, and handle the sessionData conditionally
	const chatDataQuery = useQuery(
		api.chat.getChat,
		chatId && sessionData
			? { chatId, sessionToken: sessionData.session.token }
			: "skip"
	);

	const messagesDataQuery = useQuery(
		api.messages.listMessages,
		chatId && sessionData
			? {
					chatId: chatId,
					excludeSession: sessionId,
					sessionToken: sessionData.session.token,
				}
			: "skip"
	);

	useEffect(() => {
		(async () => {
			// There is no user data after being fetched
			if (!isPending && !sessionData) {
				await authClient.signIn.anonymous();
				router.refresh();
				return;
			}

			if (sessionData)
				await initiateUserPreferences({
					sessionToken: sessionData.session.token,
				});
		})();
	}, [isPending, sessionData]);

	useEffect(() => {
		if (chatId && sessionData && chatDataQuery === null) {
			redirect("/chat");
		}
	}, [chatId, sessionData, chatDataQuery]);

	// Assign chat and messages only when the sessionData is available
	const chat = chatDataQuery ?? null;
	const messages = messagesDataQuery ?? [];

	const pairedMessages = useMemo(() => chunkArray(messages, 2), [messages]);

	const sendMessage = useMutation(api.messages.sendMessage);
	const branchMessage = useMutation(api.messages.branchMessage);
	const editMessage = useMutation(api.messages.editMessage);
	const retryMessage = useMutation(api.messages.retryMessage);
	const cancelMessage = useMutation(api.messages.cancelMessage);

	// Keep a ref only for focusing & hooks – value is stored in state
	const inputAreaRef = useRef<AutosizeTextAreaRef>(null);
	const inputContainerRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const lastPairContainerRef = useRef<HTMLDivElement>(null);

	const { modelId, providersList, setModelId } = useChatModels();

	useChatInputEvents(inputAreaRef);
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

	async function handleSubmit(
		currentInput: string,
		fileDataList?: GenericFileData[]
	) {
		if (!modelId || !sessionData) return;

		setAreSuggestionsHidden(true);

		const response = await sendMessage({
			quote: quote,
			content: currentInput,
			chatId: chatId as Id<"chats">,
			model: modelId,
			sessionId,
			fileDataList: fileDataList ?? [],
			isSearchEnabled: isSearchEnabled,
			reasoningEffort: reasoningEffort,
			sessionToken: sessionData?.session.token,
		});

		setQuote(undefined); // Clear the quote after sending
		setInputValue(""); // Clear the input box

		// If the chatId is not provided, we redirect to the chat page
		if (messages?.length === 0 || chat?.isShared) {
			router.push("/chat/" + response?.chatId);
		}

		inputAreaRef.current?.textArea.focus();
	}

	return (
		<main className="flex flex-col items-center justify-center flex-1 h-screen">
			<div
				ref={scrollContainerRef}
				className={cn(
					"flex w-full justify-center grow min-h-0 overflow-y-scroll pb-4 pt-8",
					pairedMessages?.length == 0 && "items-center"
				)}
			>
				{pairedMessages?.length > 0 ? (
					<div className="flex flex-col gap-2 w-full max-w-3xl max-lg:px-8 px-4">
						{chat && chat?.isShared && (
							<div className="w-full border-b border-accent-foreground/20 pb-2 mb-2">
								<h1 className="flex gap-2 items-end">
									<span className="text-2xl font-bold">{chat?.title}</span>
									<span className="text-lg">by Anonymous</span>
								</h1>
							</div>
						)}
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
										if (!sessionData) return;

										editMessage({
											sessionId,
											messageId,
											content,
											sessionToken: sessionData?.session.token,
										});
									}}
									onRetryMessage={(messageId, modelId?: ModelId) => {
										if (!sessionData) return;

										if (modelId) setModelId(modelId);
										retryMessage({
											sessionId,
											messageId,
											modelId,
											reasoningEffort,
											sessionToken: sessionData?.session.token,
										});
									}}
									onBranchMessage={async (messageId) => {
										if (!sessionData) return;

										const response = await branchMessage({
											messageId,
											sessionToken: sessionData?.session.token,
										});
										redirect("/chat/" + response.chatId);
									}}
									onQuote={setQuote}
								/>
							);
						})}
					</div>
				) : (
					<>
						{inputValue.length === 0 && !areSuggestionsHidden && !chatId && (
							<SuggestionsContainer
								onSelect={(suggestion: string) => {
									setInputValue(suggestion);
									inputAreaRef.current?.textArea.focus();
								}}
							/>
						)}
					</>
				)}
			</div>

			<ChatInputForm
				quote={quote}
				setQuote={setQuote}
				modelId={modelId}
				providersList={providersList}
				setModelId={setModelId}
				isAnswering={!!chat?.isAnswering}
				messagesLength={messages.length}
				inputContainerRef={inputContainerRef}
				onSubmit={handleSubmit}
				onCancel={async () => {
					if (!sessionData) return;
					await cancelMessage({
						chatId: chatId as Id<"chats">,
						sessionToken: sessionData?.session.token,
					});
				}}
				inputValue={inputValue}
				setInputValue={setInputValue}
				textAreaRef={inputAreaRef}
			/>
		</main>
	);
}
