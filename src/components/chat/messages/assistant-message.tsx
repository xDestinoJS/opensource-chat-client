"use client";

import { UIMessage } from "ai";
import { Copy, GitBranch, RefreshCcw } from "lucide-react";

import copyToClipboard from "@/utils/copy-to-clipboard";

import { MemoizedMarkdown } from "../memoized-markdown";
import IconButton from "../buttons/icon-button";

export default function AssistantMessage({
	message,
	onBranch,
	onRetry,
}: {
	message: UIMessage;
	onBranch: () => void;
	onRetry: () => void;
}) {
	return (
		<div className="w-full flex flex-col group">
			<MemoizedMarkdown id={message.id} content={message.content} />
			<div className="flex items-center mt-1 group-hover:opacity-100 opacity-0 transition-opacity">
				<IconButton
					onClick={() => copyToClipboard(message.content)}
					hasConfirmation
				>
					<Copy />
				</IconButton>
				<IconButton onClick={onBranch}>
					<GitBranch />
				</IconButton>
				<IconButton onClick={onRetry}>
					<RefreshCcw />
				</IconButton>
			</div>
		</div>
	);
}
