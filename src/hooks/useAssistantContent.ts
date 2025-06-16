import { useEffect, useRef, useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import useSessionId from "@/stores/use-session";
import { getConvexSiteUrl } from "@/lib/utils";
import { getModelDataById } from "@/lib/providers";

export default function useAssistantContent(
	userMessage: Doc<"messages">,
	assistantMessage: Doc<"messages">
) {
	const { sessionId } = useSessionId();
	const [content, setContent] = useState<string>(
		assistantMessage.content ?? ""
	);
	const controllerRef = useRef<AbortController | null>(null);

	const modelData = getModelDataById(assistantMessage.model);

	useEffect(() => {
		if (modelData?.type != "text") return;

		controllerRef.current?.abort();

		const shouldStream =
			!assistantMessage.isComplete && assistantMessage.sessionId === sessionId;

		// Handle "reset to empty" when streaming hasn’t started yet
		if (shouldStream && assistantMessage.content === "" && content !== "") {
			setContent(""); // clear local state
		}

		// If it shouldn't stream, just show whatever we have
		if (!shouldStream) {
			if (assistantMessage.content) {
				setContent(assistantMessage.content);
			}
			return;
		}

		// Start streaming
		const controller = new AbortController();
		controllerRef.current = controller;

		(async () => {
			try {
				const res = await fetch(`${getConvexSiteUrl()}/generate/text`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						chatId: assistantMessage.chatId,
						assistantMessageId: assistantMessage._id,
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
						result += chunk;
						setContent(result);
					}
				}
			} catch (err: any) {
				console.log(
					"[STREAM] An error occured when streaming the LLM's response."
				);
			}
		})();

		return () => controller?.abort("");
	}, [
		assistantMessage._id,
		assistantMessage.isComplete,
		assistantMessage.content,
		assistantMessage.sessionId,
		sessionId,
	]);

	useEffect(() => {
		if (modelData?.type != "image") return;

		(async () => {
			try {
				const res = await fetch(`${getConvexSiteUrl()}/generate/image`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						chatId: assistantMessage.chatId,
						assistantMessageId: assistantMessage._id,
					}),
				});
				if (!res.ok) return;

				const data = await res.json();
				if (data?.success) console.log("Generating image...");
			} catch (err: any) {
				console.log("[STREAM] An error occured when generating image.");
			}
		})();
	}, [assistantMessage.images]);

	return { content };
}
