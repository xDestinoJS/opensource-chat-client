"use client";

import { useEffect, useRef, RefObject, useState } from "react"; // Import useState
import { Doc } from "../../convex/_generated/dataModel";

export function useChatScrollManagement(
	inputContainerRef: RefObject<HTMLDivElement | null>,
	lastPairContainerRef: RefObject<HTMLDivElement | null>,
	scrollContainerRef: RefObject<HTMLDivElement | null>,
	scrollContainerEndRef: RefObject<HTMLDivElement | null>,
	scrollContentRef: RefObject<HTMLDivElement | null>,
	messages: Doc<"messages">[] | undefined
) {
	const isFirstLoadRef = useRef(true);
	const lastMessageScrolledTo = useRef<string | null>(null); // use message ID for comparison
	const [isAtBottom, setIsAtBottom] = useState(true); // New state for tracking if at bottom

	/**
	 * Scrolls the chat container to the bottom.
	 * @param behavior "smooth" for smooth scrolling, "instant" for immediate scrolling.
	 */
	const scrollToBottom = (behavior: "smooth" | "instant" = "smooth") => {
		const scrollContainerEndNode = scrollContainerEndRef.current;
		if (scrollContainerEndNode) {
			scrollContainerEndNode.scrollIntoView({
				block: "end",
				behavior: behavior,
			});
		}
	};

	useEffect(() => {
		const inputContainerNode = inputContainerRef.current;
		const scrollContainerEndNode = scrollContainerEndRef.current;
		const scrollContentNode = scrollContentRef.current;
		const lastPairContainerNode = lastPairContainerRef.current;

		if (
			!scrollContainerEndNode ||
			!inputContainerNode ||
			!scrollContentNode ||
			!lastPairContainerNode ||
			!messages?.length
		)
			return;

		lastPairContainerNode.style.minHeight = `calc(100vh - ${inputContainerNode.offsetHeight + 80}px)`;

		const latestMessage = messages[messages.length - 1];
		if (lastMessageScrolledTo.current === latestMessage._id) return;

		// Scroll to bottom
		setTimeout(() => {
			if (isFirstLoadRef.current) {
				scrollToBottom("instant");
				isFirstLoadRef.current = false;
			} else {
				scrollToBottom("smooth");
			}
			lastMessageScrolledTo.current = latestMessage._id;
		}, 250);
	}, [
		messages,
		inputContainerRef.current,
		lastPairContainerRef.current,
		scrollContainerEndRef.current,
		scrollContentRef.current,
	]);

	// Effect to manage the isAtBottom state
	useEffect(() => {
		const scrollContainerNode = scrollContainerRef.current;

		if (!scrollContainerNode) return;

		const handleScroll = () => {
			// Check if the user is at the very bottom of the scrollable content
			const { scrollTop, scrollHeight, clientHeight } = scrollContainerNode;
			const atBottom = scrollHeight - scrollTop <= clientHeight + 1; // Add a small tolerance

			setIsAtBottom(atBottom);
		};

		scrollContainerNode.addEventListener("scroll", handleScroll);

		// Initial check when the component mounts or dependencies change
		handleScroll();

		return () => {
			scrollContainerNode.removeEventListener("scroll", handleScroll);
		};
	}, [scrollContentRef.current]); // Re-run if the scroll content ref changes

	return {
		isAtBottom,
		scrollToBottom,
	};
}
