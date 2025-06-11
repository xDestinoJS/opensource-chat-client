"use client";

import { Doc } from "@/../convex/_generated/dataModel";
import { Copy, Split, RefreshCcw, Volume2, Square } from "lucide-react";

import copyToClipboard from "@/utils/copy-to-clipboard";

import MemoizedMarkdown from "../memoized-markdown";
import { useSpeech } from "react-text-to-speech";
import IconButton from "../buttons/icon-button";
import { cn } from "@/lib/utils";
import stripMarkdownFromString from "@/hooks/stripMarkdownFromString";

export default function AssistantMessage({
	message,
	onBranch,
	onRetry,
}: {
	message: Doc<"messages">;
	onBranch: () => void;
	onRetry: () => void;
}) {
	const content = message?.content.join("") || "";

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

	return (
		<div className="w-full flex flex-col group">
			<MemoizedMarkdown content={content} />
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
				<p className="ml-2.5 text-xs">{message.model}</p>
			</div>
		</div>
	);
}
