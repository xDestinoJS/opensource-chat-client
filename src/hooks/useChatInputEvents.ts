"use client";

import { useEffect, RefObject } from "react";
import { AutosizeTextAreaRef } from "@/components/ui/autosize-textarea";

export function useChatInputEvents(
	inputAreaRef: RefObject<AutosizeTextAreaRef | null>
) {
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
	}, [inputAreaRef]);
}
