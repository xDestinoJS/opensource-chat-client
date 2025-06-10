"use client";

import { Doc } from "@/../convex/_generated/dataModel";
import { Copy, GitBranch, RefreshCcw } from "lucide-react";

import copyToClipboard from "@/utils/copy-to-clipboard";

import MemoizedMarkdown from "../memoized-markdown";
import IconButton from "../buttons/icon-button";
import { cn } from "@/lib/utils";

export default function AssistantMessage({
	message,
	content,
	onBranch,
	onRetry,
}: {
	message: Doc<"messages">;
	content: string;
	onBranch: () => void;
	onRetry: () => void;
}) {
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
					<GitBranch />
				</IconButton>
				<IconButton onClick={onRetry}>
					<RefreshCcw />
				</IconButton>
				<p className="ml-2.5 text-xs">{message.model}</p>
			</div>
		</div>
	);
}
