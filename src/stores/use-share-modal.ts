import { create } from "zustand";
import { Doc } from "../../convex/_generated/dataModel";

type ShareModalStore = {
	isOpen: boolean;
	chat: Doc<"chats"> | null;
	open: () => void;
	close: () => void;
	setChat: (chat: Doc<"chats"> | null) => void;
};

export const useShareModalStore = create<ShareModalStore>((set) => ({
	isOpen: false,
	chat: null,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false, chat: null }),
	setChat: (chat: Doc<"chats"> | null) => set({ chat: chat }),
}));
