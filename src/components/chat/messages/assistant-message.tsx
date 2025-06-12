"use client";

import { Doc } from "@/../convex/_generated/dataModel";
import { Copy, Split, RefreshCcw, Volume2, Square, Quote } from "lucide-react";

import copyToClipboard from "@/utils/copy-to-clipboard";

import MemoizedMarkdown from "../memoized-markdown";
import { useSpeech } from "react-text-to-speech";
import IconButton from "../buttons/icon-button";
import { cn } from "@/lib/utils";
import stripMarkdownFromString from "@/utils/strip-markdown-from-string";
import { useState, useEffect, useRef, useCallback } from "react";
import models from "@/lib/models";

export default function AssistantMessage({
	message,
	onBranch,
	onRetry,
}: {
	message: Doc<"messages">;
	onBranch: () => void;
	onRetry: () => void;
}) {
	const [selectionData, setSelectionData] = useState<{
		text: string;
		position: DOMRect | null;
	}>({
		text: "",
		position: null,
	});
	const content = message?.content.join("") || "";
	const messageRef = useRef<HTMLDivElement>(null);

	const modelData = models.find((models) => models.id === message.model);

	const { start, speechStatus, stop } = useSpeech({
		text: stripMarkdownFromString(content),
	});

	function onPlayAudio() {
		if (speechStatus === "started") {
			stop();
		} else {
			start();
		}
	}

	const handleTextSelection = useCallback(() => {
		const selection = window.getSelection();
		if (
			selection &&
			selection.toString() &&
			messageRef.current &&
			selection.anchorNode &&
			messageRef.current.contains(selection.anchorNode)
		) {
			const text = selection.toString();
			const range = selection.getRangeAt(0);
			const rect = range.getClientRects()[0] || range.getBoundingClientRect();
			setSelectionData({
				text,
				position: rect,
			});
		} else {
			setSelectionData({
				text: "",
				position: null,
			});
		}
	}, []);

	useEffect(() => {
		document.addEventListener("selectionchange", handleTextSelection);
		document.addEventListener("click", handleTextSelection);
		return () => {
			document.removeEventListener("selectionchange", handleTextSelection);
			document.removeEventListener("click", handleTextSelection);
		};
	}, [handleTextSelection]); // Added handleTextSelection to dependencies

	return (
		<div className="relative w-full flex flex-col group" ref={messageRef}>
			<MemoizedMarkdown content={content} />
			{selectionData.text != "" &&
				messageRef.current &&
				selectionData.position && (
					<button
						className="absolute cursor-pointer bg-secondary py-2 px-3.5 rounded-full border border-accent-foreground/10 shadow-sm"
						style={{
							top:
								selectionData.position.top -
								messageRef.current.getBoundingClientRect().top -
								42.5,
							left:
								selectionData.position.left -
								messageRef.current.getBoundingClientRect().left +
								selectionData.position.width / 2,
							transform: "translateX(-50%)",
						}}
						onClick={() => {
							alert(selectionData.text);
						}}
					>
						<Quote size={16} />
					</button>
				)}
			<div
				className={cn(
					"flex items-center mt-1 opacity-0 transition-opacity",
					message.isComplete && "group-hover:opacity-100"
				)}
			>
				<IconButton onClick={() => copyToClipboard(content)} hasConfirmation>
					<Copy />
				</IconButton>
				<IconButton onClick={onBranch}>
					<Split />
				</IconButton>
				<IconButton onClick={onPlayAudio}>
					{speechStatus != "started" ? <Volume2 /> : <Square />}
				</IconButton>
				<IconButton onClick={onRetry}>
					<RefreshCcw />
				</IconButton>
				<p className="ml-2.5 text-xs">{modelData?.name}</p>
			</div>
		</div>
	);
}
