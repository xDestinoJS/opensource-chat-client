"use client";

import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

import UserMessage from "@/components/chat/messages/user-message";
import AssistantMessage from "@/components/chat/messages/assistant-message";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function Page() {
	const chatId = "j97c159vt723jjg6wdnq886xgs7hjeyv" as Id<"chats">;

	const messages = useQuery(api.messages.listMessages, {
		chatId,
	});
	const sendMessage = useMutation(api.messages.sendMessage);

	const inputAreaRef = useRef<HTMLTextAreaElement>(null);

	const [input, setInput] = useState("");

	function handleSubmit() {
		if (!input.trim()) return;

		sendMessage({
			content: input,
			chatId,
			model: "mistral-small",
		});

		setInput("");
		if (inputAreaRef.current) {
			inputAreaRef.current.value = "";
			inputAreaRef.current.focus();
		}
	}

	/* const {
		messages,
		append,
		input,
		reload,
		handleInputChange,
		handleSubmit,
		setMessages,
	} = useChat({
		api: "/api/ai/chat",
		body: {
			model: "mistral-small",
		},
	}); */

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

	/* const updateMessages = (
		messageId: string,
		includeCurrentMessage: boolean
	) => {
		setMessages((prev) => {
			const index = prev.findIndex((msg) => msg.id === messageId);
			return prev.slice(0, includeCurrentMessage ? index + 1 : index);
		});
	};
 */
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
										console.log("edit");
										/* updateMessages(message.id, false);
										append({
											id: message.id,
											content,
											role: "user",
										}); */
									}}
									onRetry={() => {
										console.log("retry");
										/* updateMessages(message.id, true);
										reload(); */
									}}
								/>
							) : (
								<AssistantMessage
									message={message}
									onBranch={() => alert("branching")}
									onRetry={() => {} /* reload */}
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
					value={input}
					onChange={() => {
						setInput(inputAreaRef.current?.value || "");
					}}
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
