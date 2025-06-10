"use client";

import { useEffect, useRef, RefObject } from "react";
import { Doc } from "../../convex/_generated/dataModel";

export function useChatScrollManagement(
	lastPairContainerRef: RefObject<HTMLDivElement | null>,
	blankSpaceRef: RefObject<HTMLDivElement | null>,
	scrollContainerRef: RefObject<HTMLDivElement | null>,
	messages: Doc<"messages">[] | undefined
) {
	const isFirstLoadRef = useRef(true);
	const lastMessageScrolledTo = useRef<string | null>(null); // use message ID for comparison

	useEffect(() => {
		const lastPairNode = lastPairContainerRef.current;
		const blankSpaceNode = blankSpaceRef.current;
		const scrollNode = scrollContainerRef.current;

		if (!scrollNode || !lastPairNode || !blankSpaceNode || !messages?.length)
			return;

		const latestMessage = messages[messages.length - 1];

		// Only scroll if the message changed

		// Update blank space
		const scrollHeight = scrollNode.offsetHeight;
		const lastPairHeight = lastPairNode.offsetHeight;

		blankSpaceNode.style.paddingTop = `${Math.max(scrollHeight - lastPairHeight - 16, 0)}px`;

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
	}, [messages, lastPairContainerRef, blankSpaceRef, scrollContainerRef]);
}
