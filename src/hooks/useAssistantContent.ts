import { useEffect, useRef, useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import useSessionId from "@/stores/use-session";
import { getConvexSiteUrl } from "@/lib/utils";

export default function useAssistantContent(message: Doc<"messages">) {
	const { sessionId } = useSessionId();
	const [content, setContent] = useState<string>(message.content ?? "");
	const [cancelReason, setCancelReason] = useState<
		"user_request" | undefined
	>();
	const controllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		controllerRef.current?.abort();

		const shouldStream = !message.isComplete && message.sessionId === sessionId;

		// Handle "reset to empty" when streaming hasn’t started yet
		if (shouldStream && message.content === "" && content !== "") {
			setContent(""); // clear local state
			setCancelReason(undefined);
		}

		// If it shouldn't stream, just show whatever we have
		if (!shouldStream) {
			if (message.content) {
				setContent(message.content);
				setCancelReason(undefined);
			}
			return;
		}

		// Start streaming
		const controller = new AbortController();
		controllerRef.current = controller;

		(async () => {
			try {
				const res = await fetch(`${getConvexSiteUrl()}/chat`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						chatId: message.chatId,
						assistantMessageId: message._id,
					}),
					signal: controller.signal,
				});

				const reader = res.body?.getReader();
				const decoder = new TextDecoder();
				let result = "";

				while (reader && !controller.signal.aborted) {
					const { done, value } = await reader.read();
					if (done) break;

					if (value) {
						const chunk = decoder.decode(value, { stream: true });
						if (chunk.includes("[[CANCEL:USER_REQUEST]]")) {
							setCancelReason("user_request");
							break; // stop reading further
						}

						result += chunk;
						setContent(result);
					}
				}
			} catch (err: any) {
				if (err.name !== "AbortError") {
					console.error("[STREAM] error:", err);
				}
			}
		})();

		return () => controller.abort();
	}, [
		message._id,
		message.isComplete,
		message.content,
		message.sessionId,
		sessionId,
	]);

	return { content, cancelReason };
}
