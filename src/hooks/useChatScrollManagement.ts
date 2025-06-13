"use client";

import { useEffect, useRef, RefObject } from "react";
import { Doc } from "../../convex/_generated/dataModel";

export function useChatScrollManagement(
	lastPairContainerRef: RefObject<HTMLDivElement | null>,
	inputContainerRef: RefObject<HTMLDivElement | null>,
	scrollContainerRef: RefObject<HTMLDivElement | null>,
	messages: Doc<"messages">[] | undefined
) {
	const isFirstLoadRef = useRef(true);
	const lastMessageScrolledTo = useRef<string | null>(null); // use message ID for comparison

	useEffect(() => {
		const lastPairNode = lastPairContainerRef.current;
		const inputContainerNode = inputContainerRef.current;
		const scrollNode = scrollContainerRef.current;

		if (
			!scrollNode ||
			!lastPairNode ||
			!inputContainerNode ||
			!messages?.length
		)
			return;

		lastPairNode.style.minHeight = `calc(100vh - ${inputContainerNode.offsetHeight + 32}px)`;

		const latestMessage = messages[messages.length - 1];
		if (lastMessageScrolledTo.current === latestMessage._id) return;

		// Scroll to bottom
		requestAnimationFrame(() => {
			if (isFirstLoadRef.current) {
				scrollNode.scrollTop = scrollNode.scrollHeight;
				isFirstLoadRef.current = false;
			} else {
				scrollNode.scrollTo({
					top: scrollNode.scrollHeight,
					behavior: "smooth",
				});
			}
			lastMessageScrolledTo.current = latestMessage._id;
		});
	}, [messages, lastPairContainerRef]);
}
