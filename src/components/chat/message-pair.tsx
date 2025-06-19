"use client";

import { Doc, Id } from "../../../convex/_generated/dataModel";
import UserMessage from "./messages/user-message";
import AssistantMessage from "./messages/assistant-message";
import { ModelId } from "@/lib/providers";

interface MessagePairProps {
	userMessage: Doc<"messages">;
	assistantMessage?: Doc<"messages">;
	isLastPair: boolean;
	lastPairContainerRef?: React.RefObject<HTMLDivElement | null>;
	onEditMessage: (messageId: Id<"messages">, content: string) => void;
	onRetryMessage: (messageId: Id<"messages">, modelId?: ModelId) => void;
	onBranchMessage: (messageId: Id<"messages">) => Promise<void>;
	onQuote: (quote: string) => void;
}

export default function MessagePair({
	userMessage,
	assistantMessage,
	isLastPair,
	lastPairContainerRef,
	onEditMessage,
	onRetryMessage,
	onBranchMessage,
	onQuote,
}: MessagePairProps) {
	return (
		<div
			ref={isLastPair ? lastPairContainerRef : null}
			className={isLastPair ? "pb-4 grow" : "min-h-auto!"}
		>
			{/* User Message */}
			<div className="flex w-full">
				<div className="w-full justify-end">
					<UserMessage
						userMessage={userMessage}
						onEdit={(content) => {
							onEditMessage(userMessage._id, content);
						}}
						onRetry={(modelId?: ModelId) => {
							onRetryMessage(userMessage._id, modelId);
						}}
					/>
				</div>
			</div>

			{/* Assistant Message */}
			{assistantMessage && (
				<div className="flex w-full">
					<div className="w-full justify-start">
						<AssistantMessage
							userMessage={userMessage}
							assistantMessage={assistantMessage}
							onBranch={async () => {
								await onBranchMessage(assistantMessage._id);
							}}
							onRetry={(modelId?: ModelId) => {
								onRetryMessage(assistantMessage._id, modelId);
							}}
							onQuote={onQuote}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
