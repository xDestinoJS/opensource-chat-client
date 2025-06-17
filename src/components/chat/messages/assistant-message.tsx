"use client";

import { Doc } from "@/../convex/_generated/dataModel";
import {
	Copy,
	Split,
	Volume2,
	Square,
	RefreshCcw,
	ChevronDown,
} from "lucide-react";
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
import { useMemo, useState } from "react";
import RetryDropdown from "../retry-dropdown";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextShimmer } from "@/components/ui/text-shimmer";

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
	const [isReasoningVisible, setIsReasoningVisible] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const { selectionData, contentRef } = useTextSelection();
	const { text: content, reasoning } = useAssistantContent(
		userMessage,
		assistantMessage
	);

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

	const shouldContentExist = useMemo(() => {
		return (
			(assistantMessage.isStreaming || assistantMessage.isComplete) &&
			(content.length > 0 || reasoning.length > 0)
		);
	}, [assistantMessage, content, reasoning]);

	return (
		<div className="relative w-full flex flex-col group">
			{shouldContentExist && reasoning.length > 0 && (
				<div>
					<Button
						variant="ghost"
						size="sm"
						className="mb-2 hover:bg-transparent p-0!"
						onClick={() => setIsReasoningVisible(!isReasoningVisible)}
					>
						<span>
							{assistantMessage.reasoning?.isReasoning ? (
								<TextShimmer duration={3}>Thinking...</TextShimmer>
							) : (
								`Thought for ${Math.round(((assistantMessage.reasoning?.endedAt || 0) - (assistantMessage.reasoning?.startedAt || 0)) / 1000)} seconds`
							)}
						</span>
						<ChevronDown className={isReasoningVisible ? "rotate-180" : ""} />
					</Button>
					{isReasoningVisible && (
						<div className="text-sm mb-6">
							<MemoizedMarkdown
								content={reasoning}
								className="text-sm text-muted-foreground"
							/>
						</div>
					)}
				</div>
			)}

			<div className="w-full" ref={contentRef}>
				{shouldContentExist ? (
					<MemoizedMarkdown content={content} />
				) : (
					<WaveLoader />
				)}
			</div>

			<div className="max-w-1/2">
				{assistantMessage.images.map((file) => {
					return (
						file.uploadUrl.length > 0 && (
							<Zoom key={file.fileId} zoomMargin={10}>
								<img
									className="rounded-xl border border-muted-foreground/20"
									src={file.uploadUrl}
									alt={file.name}
								/>
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
					{assistantMessage.cancelReason == "system_error" &&
						"Something went wrong"}
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

				<p className="ml-3 text-xs">
					{getFullModelName(assistantMessage.model)}
				</p>

				{assistantMessage?.sources && (
					<div className="ml-2.5 flex gap-2 hover:bg-muted text-xs rounded-full p-1 items-center overflow-y-scroll no-scrollbar">
						{assistantMessage?.sources.map((source, index) => {
							return (
								<Tooltip key={index}>
									<TooltipTrigger
										className="not-first:-ml-3.25 shrink-0"
										asChild
									>
										<Link href={source.url} target="_blank">
											<img
												className="size-[20px] rounded-full bg-secondary border border-muted"
												src={`https://www.google.com/s2/favicons?domain=${source.title}&sz=256`}
												alt={source.title}
											/>
										</Link>
									</TooltipTrigger>
									<TooltipContent>{source.title}</TooltipContent>
								</Tooltip>
							);
						})}
					</div>
				)}
			</div>
			{isLastPair && <div className="pt-4" />}
		</div>
	);
}
