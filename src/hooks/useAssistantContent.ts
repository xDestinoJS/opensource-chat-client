import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import useSessionId from "@/stores/use-session";
import { getConvexSiteUrl } from "@/lib/utils";

export default function useAssistantContent(message: Doc<"messages">) {
	const { sessionId } = useSessionId();
	const [content, setContent] = useState<string>("");

	useEffect(() => {
		async function updateContent() {
			if (!message.isComplete && message.sessionId == sessionId) {
				try {
					const response = await fetch(`${getConvexSiteUrl()}/chat`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							chatId: message.chatId,
							assistantMessageId: message._id,
						}),
					});

					const reader = response.body?.getReader();
					const decoder = new TextDecoder();

					if (reader) {
						let result = "";

						while (true) {
							const { done, value } = await reader.read();
							if (done) break;
							result += decoder.decode(value, { stream: true });
							setContent(result);
						}
					}
				} catch {
					console.log(
						"[STREAM] An error occured when initiating message stream."
					);
				}
			} else {
				setContent(message.content);
			}
		}

		updateContent();
	}, [message.content, message.sessionId, message._id, sessionId]);

	return {
		content,
	};
}
