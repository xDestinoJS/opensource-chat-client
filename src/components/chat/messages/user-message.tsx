"use client";

import { cn } from "@/lib/utils";
import copyToClipboard from "@/utils/copy-to-clipboard";
import { UIMessage } from "ai";
import { KeyboardEvent, useRef, useState } from "react";

export default function UserMessage({
	message,
	onEdit,
	onRetry,
}: {
	message: UIMessage;
	onEdit: (content: string) => void;
	onRetry: () => void;
}) {
	const [newContent, setNewContent] = useState(message.content);
	const [isEditing, setIsEditing] = useState(false);

	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onEdit(newContent);
			setIsEditing(false);
		}
	}

	function toggleEditing() {
		setIsEditing(!isEditing);

		// If we are switching to editing mode, set the content to the current content
		if (isEditing) {
			setNewContent(message.content);
		} else {
			setNewContent(newContent);
		}
	}

	return (
		<div className="w-full flex flex-col justify-end items-end">
			<div
				className={cn(
					"border border-neutral-400 px-2.5 py-2 rounded-xl",
					isEditing ? "w-3/4" : "w-max"
				)}
			>
				{!isEditing ? (
					<p className="w-max whitespace-pre-wrap">{message.content}</p>
				) : (
					<textarea
						className="w-full focus:outline-none resize-none bg-transparent"
						value={newContent}
						onChange={(e) => setNewContent(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
				)}
			</div>
			<div className="flex justify-end items-center mt-2 gap-2">
				<button onClick={onRetry}>Retry</button>
				<button onClick={toggleEditing}>Edit</button>
				<button onClick={() => copyToClipboard(message.content)}>Copy</button>
			</div>
		</div>
	);
}
