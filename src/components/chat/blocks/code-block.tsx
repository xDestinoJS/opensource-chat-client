"use client";

import copyToClipboard from "@/utils/copy-to-clipboard";
import { Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import IconButton from "../buttons/icon-button";

export default function CodeBlock({
	language,
	code,
}: {
	language?: string;
	code: string;
}) {
	return (
		<div className="rounded-lg overflow-hidden border border-neutral-300/2.5 my-2">
			<div className="flex justify-between items-center gap-2 w-full bg-gradient-top p-1 pl-3 text-sm">
				<div>{language}</div>
				<div>
					<IconButton onClick={() => copyToClipboard(code)} hasConfirmation>
						<Copy />
					</IconButton>
				</div>
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
