import { UIMessage } from "ai";
import copyToClipboard from "@/utils/copy-to-clipboard";
import { MemoizedMarkdown } from "../memoized-markdown";

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
		<div className="w-full flex flex-col">
			<MemoizedMarkdown id={message.id} content={message.content} />
			<div className="flex items-center mt-2 gap-2">
				<button onClick={() => copyToClipboard(message.content)}>Copy</button>
				<button onClick={onBranch}>Branch</button>
				<button onClick={onRetry}>Retry</button>
			</div>
		</div>
	);
}
