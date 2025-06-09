"use client";

import copyToClipboard from "@/utils/copy-to-clipboard";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeBlock({
	language,
	code,
}: {
	language?: string;
	code: string;
}) {
	return (
		<div className="rounded-lg overflow-hidden border border-neutral-300 my-2">
			<div className="flex justify-between gap-2 w-full h-10 bg-neutral-200 p-2 text-sm">
				<div>{language}</div>
				<button
					className="cursor-pointer"
					onClick={() => {
						copyToClipboard(code);
					}}
				>
					Copy
				</button>
			</div>
			<div>
				<SyntaxHighlighter
					PreTag="div"
					children={code.replace(/\n$/, "")}
					language={language}
					style={dracula}
					customStyle={{ margin: 0, borderRadius: 0, fontSize: ".95rem" }}
				/>
			</div>
		</div>
	);
}
