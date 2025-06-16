"use client";

import { Doc } from "@/../convex/_generated/dataModel";
import { Copy, Split, Volume2, Square, RefreshCcw } from "lucide-react";
import { RiDoubleQuotesR } from "react-icons/ri";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import copyToClipboard from "@/utils/copy-to-clipboard";

import MemoizedMarkdown from "../memoized-markdown";
import { useSpeech } from "react-text-to-speech";
import IconButton from "../buttons/icon-button";
import { cn } from "@/lib/utils";
import stripMarkdownFromString from "@/utils/strip-markdown-from-string";
import { getFullModelName, ModelId } from "@/lib/providers";
import { useTextSelection } from "@/hooks/useTextSelection";
import useAssistantContent from "@/hooks/useAssistantContent";
import WaveLoader from "../wave-loader";
import { useState } from "react";
import RetryDropdown from "../retry-dropdown";

export default function AssistantMessage({
	userMessage,
	assistantMessage,
	isLastPair,
	onBranch,
	onRetry,
	onQuote,
}: {
	userMessage: Doc<"messages">;
	assistantMessage: Doc<"messages">;
	isLastPair: boolean;
	onBranch: () => void;
	onRetry: (modelId?: ModelId) => void;
	onQuote: (quote: string) => void;
}) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const { selectionData, contentRef } = useTextSelection();
	const { content } = useAssistantContent(userMessage, assistantMessage);

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
				{content.length > 0 || assistantMessage.isComplete ? (
					<MemoizedMarkdown content={content} />
				) : (
					<WaveLoader />
				)}
			</div>

			<div className="max-w-1/2">
				{assistantMessage.images.map((image) => {
					return (
						image.url.length > 0 && (
							<Zoom key={image.id} zoomMargin={10}>
								<img className="rounded-xl" src={image.url} alt={image.name} />
							</Zoom>
						)
					);
				})}
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

			{assistantMessage.cancelReason && (
				<div className="w-full rounded-lg bg-destructive/7.5 my-2 py-3 px-4.5 text-sm text-destructive">
					{assistantMessage.cancelReason == "user_request" && "Stopped by user"}
				</div>
			)}

			<div
				className={cn(
					"flex items-center mt-1 opacity-0 transition-opacity",
					assistantMessage.isComplete
						? "group-hover:opacity-100"
						: "pointer-events-none",
					isDropdownOpen && "opacity-100!"
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
				<RetryDropdown
					isDropdownOpen={isDropdownOpen}
					setIsDropdownOpen={setIsDropdownOpen}
					onRetry={onRetry}
				>
					<IconButton>
						<RefreshCcw />
					</IconButton>
				</RetryDropdown>

				<p className="ml-2.5 text-xs">
					{getFullModelName(assistantMessage.model)}
				</p>
			</div>
			{isLastPair && <div className="pt-4" />}
		</div>
	);
}
