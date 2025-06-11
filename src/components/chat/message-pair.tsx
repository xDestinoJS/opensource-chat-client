"use client";

import { Doc, Id } from "../../../convex/_generated/dataModel";
import UserMessage from "./messages/user-message";
import AssistantMessage from "./messages/assistant-message";

interface MessagePairProps {
	userMessage: Doc<"messages">;
	assistantMessage?: Doc<"messages">;
	isLastPair: boolean;
	lastPairContainerRef?: React.RefObject<HTMLDivElement | null>;
	onEditMessage: (messageId: Id<"messages">, content: string) => void;
	onRetryMessage: (messageId: Id<"messages">) => void;
	onBranchMessage: (messageId: Id<"messages">) => Promise<void>;
}

export default function MessagePair({
	userMessage,
	assistantMessage,
	isLastPair,
	lastPairContainerRef,
	onEditMessage,
	onRetryMessage,
	onBranchMessage,
}: MessagePairProps) {
	return (
		<div
			ref={isLastPair ? lastPairContainerRef : null}
			className={isLastPair ? "pb-4" : undefined}
		>
			{/* User Message */}
			<div className="flex w-full">
				<div className="w-full justify-end">
					<UserMessage
						message={userMessage}
						onEdit={(content) => {
							onEditMessage(userMessage._id, content);
						}}
						onRetry={() => {
							onRetryMessage(userMessage._id);
						}}
					/>
				</div>
			</div>

			{/* Assistant Message */}
			{assistantMessage && (
				<div className="flex w-full">
					<div className="w-full justify-start">
						<AssistantMessage
							message={assistantMessage}
							onBranch={async () => {
								await onBranchMessage(assistantMessage._id);
							}}
							onRetry={() => {
								onRetryMessage(assistantMessage._id);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
