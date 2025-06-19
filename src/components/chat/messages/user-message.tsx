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
import { TextQuote } from "@/components/text-quote";
import { ModelId } from "@/lib/providers";
import RetryDropdown from "../retry-dropdown";
import ImagePreview from "../previews/image-preview";
import PDFPreview from "../previews/pdf-preview";

export default function UserMessage({
	userMessage,
	onEdit,
	onRetry,
}: {
	userMessage: Doc<"messages">;
	onEdit: (content: string) => void;
	onRetry: (modelId?: ModelId) => void;
}) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const textAreaRef = useRef<AutosizeTextAreaRef>(null);
	const content = userMessage.content;

	const [newContent, setNewContent] = useState<string>(content);
	const [isEditing, setIsEditing] = useState(false);

	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Escape") {
			e.preventDefault();
			setIsEditing(false);
			setNewContent(content);
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
			setNewContent(content);
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
		<div className="flex flex-col justify-end items-end group">
			{(userMessage.images.length > 0 || userMessage.documents.length > 0) && (
				<div className="flex justify-end h-17 gap-2 w-full overflow-x-scroll no-scrollbar mb-2">
					{userMessage.images.map((fileData) => (
						<ImagePreview key={fileData.fileId} fileData={fileData} />
					))}
					{userMessage.documents.map((fileData) => (
						<PDFPreview key={fileData.fileId} fileData={fileData} />
					))}
				</div>
			)}
			{userMessage.quote && (
				<TextQuote
					quote={userMessage.quote}
					variant="background"
					className="mb-2 w-max max-w-full"
				/>
			)}
			<div
				className={cn(
					"bg-foreground/4 px-3.5 py-3 rounded-xl max-w-3/4",
					isEditing ? "w-full" : "max-w-2/3"
				)}
			>
				{!isEditing ? (
					<p className="whitespace-pre-wrap break-all">{content}</p>
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
			<div
				className={cn(
					"flex justify-end items-center mt-1 group-hover:opacity-100 opacity-0 transition-opacity w-full",
					isDropdownOpen && "opacity-100!"
				)}
			>
				{userMessage.isModifiable != false && (
					<>
						<RetryDropdown
							isDropdownOpen={isDropdownOpen}
							setIsDropdownOpen={setIsDropdownOpen}
							onRetry={onRetry}
						>
							<IconButton>
								<RefreshCcw />
							</IconButton>
						</RetryDropdown>
						<IconButton onClick={toggleEditing}>
							<EditIcon />
						</IconButton>
					</>
				)}
				<IconButton onClick={() => copyToClipboard(content)} hasConfirmation>
					<Copy />
				</IconButton>
			</div>
		</div>
	);
}
