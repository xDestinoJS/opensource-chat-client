import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./blocks/code-block";
import remarkGfm from "remark-gfm";

function parseMarkdownIntoBlocks(markdown: string): string[] {
	const tokens = marked.lexer(markdown);
	return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
	({ content }: { content: string }) => {
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
					{content}
				</ReactMarkdown>
			</div>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.content === nextProps.content;
	}
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
	({ content, id }: { content: string; id: string }) => {
		const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

		return blocks.map((block, index) => (
			<MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
		));
	}
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
