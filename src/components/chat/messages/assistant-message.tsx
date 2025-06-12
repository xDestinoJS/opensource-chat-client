"use client";

import { Doc } from "@/../convex/_generated/dataModel";
import { Copy, Split, RefreshCcw, Volume2, Square } from "lucide-react";
import { RiDoubleQuotesR } from "react-icons/ri";

import copyToClipboard from "@/utils/copy-to-clipboard";

import MemoizedMarkdown from "../memoized-markdown";
import { useSpeech } from "react-text-to-speech";
import IconButton from "../buttons/icon-button";
import { cn } from "@/lib/utils";
import stripMarkdownFromString from "@/utils/strip-markdown-from-string";
import models from "@/lib/models";
import { useTextSelection } from "@/hooks/useTextSelection";

export default function AssistantMessage({
	message,
	onBranch,
	onRetry,
	onQuote,
}: {
	message: Doc<"messages">;
	onBranch: () => void;
	onRetry: () => void;
	onQuote: (quote: string) => void;
}) {
	const { selectionData, contentRef } = useTextSelection();
	const content = message?.content;
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

	return (
		<div className="relative w-full flex flex-col group">
			<div className="w-full" ref={contentRef}>
				{content.length > 0 ? (
					<MemoizedMarkdown content={content} />
				) : (
					<p>Loading...</p>
				)}
			</div>
			{selectionData.text != "" &&
				contentRef.current &&
				selectionData.position && (
					<button
						className="absolute cursor-pointer bg-background py-2 px-3.5 rounded-full border border-accent-foreground/10 shadow-sm"
						style={{
							top:
								selectionData.position.top -
								contentRef.current.getBoundingClientRect().top -
								42.5,
							left:
								selectionData.position.left -
								contentRef.current.getBoundingClientRect().left +
								selectionData.position.width / 2,
							transform: "translateX(-50%)",
						}}
						onClick={() => {
							onQuote(selectionData.text);
						}}
					>
						<RiDoubleQuotesR />
					</button>
				)}
			<div
				className={cn(
					"flex items-center mt-1 opacity-0 transition-opacity",
					message.isComplete ? "group-hover:opacity-100" : "pointer-events-none"
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
