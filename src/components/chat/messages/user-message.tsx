"use client";

import { Doc } from "@/../convex/_generated/dataModel";
import { KeyboardEvent, useRef, useState } from "react";
import { Copy, EditIcon, RefreshCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import copyToClipboard from "@/utils/copy-to-clipboard";

import IconButton from "../buttons/icon-button";
import {
	AutosizeTextarea,
	AutosizeTextAreaRef,
} from "@/components/ui/autosize-textarea";

export default function UserMessage({
	message,
	onEdit,
	onRetry,
}: {
	message: Doc<"messages">;
	onEdit: (content: string) => void;
	onRetry: () => void;
}) {
	const textAreaRef = useRef<AutosizeTextAreaRef>(null);

	const [newContent, setNewContent] = useState(message.content);
	const [isEditing, setIsEditing] = useState(false);

	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Escape") {
			e.preventDefault();
			setIsEditing(false);
			setNewContent(message.content);
			return;
		}

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
			setTimeout(() => {
				if (textAreaRef.current) {
					textAreaRef.current.textArea.focus();
					textAreaRef.current.textArea.setSelectionRange(
						newContent.length,
						newContent.length
					);
				}
			}, 100);
		}
	}

	return (
		<div className="w-full flex flex-col justify-end items-end group">
			<div
				className={cn(
					"border border-neutral-400 px-2.5 py-2 rounded-xl max-w-3/4",
					isEditing ? "w-full" : "w-max"
				)}
			>
				{!isEditing ? (
					<p className="w-full whitespace-pre-wrap break-all">
						{message.content}
					</p>
				) : (
					<AutosizeTextarea
						ref={textAreaRef}
						className="w-full focus:outline-none resize-none bg-transparent"
						type="transparent"
						value={newContent}
						onChange={(e) => setNewContent(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
				)}
			</div>
			<div className="flex justify-end items-center mt-1 group-hover:opacity-100 opacity-0 transition-opacity w-full">
				<IconButton onClick={onRetry}>
					<RefreshCcw />
				</IconButton>
				<IconButton onClick={toggleEditing}>
					<EditIcon />
				</IconButton>
				<IconButton
					onClick={() => copyToClipboard(message.content)}
					hasConfirmation
				>
					<Copy />
				</IconButton>
			</div>
		</div>
	);
}
