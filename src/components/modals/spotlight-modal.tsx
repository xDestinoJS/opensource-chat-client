"use client";

import { useMutation, useQuery } from "convex/react";
import SearchInput from "../sidebar/search-input";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { Clock, Plus } from "lucide-react";
import useChatModels from "@/hooks/useChatModels";
import useSessionId from "@/stores/use-session";
import { useChatFeatures } from "@/stores/use-chat-features-store";
import { useRouter } from "next/navigation";
import { useSpotlightModalStore } from "@/stores/use-spotlight-modal";
import { useSession } from "@/lib/auth-client";

export default function SpotlightModal() {
	const router = useRouter();
	const { isSearchEnabled, reasoningEffort } = useChatFeatures();
	const { modelId } = useChatModels();
	const { sessionId } = useSessionId();
	const { data: sessionData } = useSession();

	const { isOpen, open, close } = useSpotlightModalStore();

	const sendMessage = useMutation(api.messages.sendMessage);

	const [query, setQuery] = useState("");
	const allChats =
		useQuery(
			api.chat.listChats,
			sessionData
				? {
						sessionToken: sessionData?.session.token,
					}
				: "skip"
		) ?? []; // Renamed to allChats for clarity
	const chatButtonRefs = useRef<(HTMLAnchorElement | null)[]>([]);

	const normalizedQuery = query.toLowerCase();
	const matchingChats = allChats.filter((chat) =>
		chat.title.toLowerCase().includes(normalizedQuery)
	);

	async function startNewChat() {
		if (!modelId || !sessionData) return;

		const response = await sendMessage({
			content: query,
			model: modelId,
			sessionId,
			isSearchEnabled: isSearchEnabled,
			reasoningEffort: reasoningEffort,
			fileDataList: [],
			sessionToken: sessionData?.session.token,
		});

		if (response) {
			router.push(`/chat/${response.chatId}`);
		}
	}

	// Open when user runs CTRL+K or CMD+K
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "k") {
				e.preventDefault();
				open();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	// This handler is ONLY for the SearchInput
	const handleSearchInputKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "ArrowDown") {
			if (matchingChats.length > 0) {
				e.preventDefault();
				chatButtonRefs.current[0]?.focus();
			}
		}
	};

	// This handler is ONLY for navigating WITHIN the list of chats
	const handleChatListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (matchingChats.length === 0) return;

		const focusableElements = chatButtonRefs.current.filter(
			(el) => el !== null
		) as HTMLElement[];
		const currentIndex = focusableElements.indexOf(
			document.activeElement as HTMLElement
		);

		if (currentIndex === -1) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			const nextIndex = (currentIndex + 1) % focusableElements.length;
			focusableElements[nextIndex]?.focus();
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			const prevIndex =
				(currentIndex - 1 + focusableElements.length) %
				focusableElements.length;
			focusableElements[prevIndex]?.focus();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={close}>
			<DialogContent
				showCloseButton={false}
				showOverlay={false}
				className="gap-0 max-w-sm p-1 shadow-xl focus-visible:ring-0"
			>
				<DialogTitle className="sr-only">Spotlight Modal</DialogTitle>

				<SearchInput
					query={query}
					setQuery={setQuery}
					className="pb-1"
					icons={[Plus]}
					onEnter={() => {
						startNewChat();
					}}
					placeholder="Search or press Enter to start new chat..."
					onKeyDown={handleSearchInputKeyDown}
				/>

				<ScrollArea className="w-full min-h-30 max-h-90 overflow-y-scroll px-2">
					<div className="pt-1" onKeyDown={handleChatListKeyDown}>
						{matchingChats.length > 0 && (
							<div className="flex gap-2 my-1.25 font-semibold text-sm items-center w-full">
								{query.length === 0 ? (
									<>
										<Clock size={14} /> <span>Recent Chats</span>
									</>
								) : (
									<span>Threads ({matchingChats.length})</span>
								)}
							</div>
						)}

						{matchingChats.map((chat, i) => (
							<Button
								key={chat._id}
								className="w-full justify-start focus:bg-muted focus-visible:ring-0"
								size="sm"
								variant="ghost"
								asChild
							>
								<Link
									href={`/chat/${chat._id}`}
									ref={(el) => {
										chatButtonRefs.current[i] = el;
									}}
								>
									{chat.title}
								</Link>
							</Button>
						))}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
