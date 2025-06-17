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
	const [content, setContent] = useState<{
		text: string;
		reasoning: string;
	}>({
		text: assistantMessage.content ?? "",
		reasoning: assistantMessage.reasoning?.content ?? "",
	});
	const controllerRef = useRef<AbortController | null>(null);

	const modelData = getModelDataById(assistantMessage.model);

	useEffect(() => {
		if (modelData?.type != "text") return;

		controllerRef.current?.abort();

		const shouldStream =
			assistantMessage.isComplete == false &&
			assistantMessage.sessionId === sessionId &&
			assistantMessage.isStreaming == false;

		// Handle "reset to empty" when streaming hasn’t started yet
		if (
			shouldStream ||
			(assistantMessage.content === "" &&
				content.text !== "" &&
				!controllerRef.current) // ensure it's not already streaming
		) {
			setContent({
				text: "",
				reasoning: "",
			});
		}

		// If it shouldn't stream, just show whatever we have
		if (!shouldStream) {
			if (
				assistantMessage.content.length > 0 ||
				(assistantMessage?.reasoning?.content ?? "").length > 0
			) {
				setContent({
					text: assistantMessage.content,
					reasoning: assistantMessage.reasoning?.content ?? "",
				});
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
				let result = {
					text: "",
					reasoning: "",
				};

				while (reader && !controller.signal.aborted) {
					const { done, value } = await reader.read();
					if (done) break;

					if (value) {
						const chunks = decoder
							.decode(value, { stream: true })
							.trim()
							.split("\n");

						chunks.forEach((chunk) => {
							try {
								const parsed = JSON.parse(chunk);
								result = {
									text: result.text + (parsed.text ?? ""),
									reasoning: result.reasoning + (parsed.reasoning ?? ""),
								};
								setContent(result);
							} catch (e) {
								console.log(e);
							}
						});
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

	return {
		text: content.text,
		reasoning: content.reasoning,
	};
}
