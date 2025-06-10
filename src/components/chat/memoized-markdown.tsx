import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./blocks/code-block";
import remarkGfm from "remark-gfm";

const MemoizedMarkdown = memo(
	({ content }: { content: string }) => {
		// Only memoize content processing if needed
		const markdownContent = useMemo(() => content, [content]);

		return (
			<div className="prose w-full mb-1 max-w-none">
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					components={{
						pre: ({ node, ...props }) => {
							return <pre className="not-prose" {...props} />;
						},
						code({ className, children }) {
							const match = /language-(\w+)/.exec(className ?? "");
							const language = match ? match[1] : "plaintext";

							return match ? (
								<CodeBlock
									language={language}
									code={children?.toString() || ""}
								/>
							) : (
								<code className="bg-neutral-100 p-1 not-prose text-sm rounded-sm">
									{children}
								</code>
							);
						},
					}}
				>
					{markdownContent}
				</ReactMarkdown>
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Only re-render if content changes
		return prevProps.content === nextProps.content;
	}
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";

export default MemoizedMarkdown;
