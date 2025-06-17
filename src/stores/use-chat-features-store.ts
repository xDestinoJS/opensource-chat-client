import { ReasoningEffort } from "@/lib/ai";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ChatFeatureState {
	isSearchEnabled: boolean;
	toggleSearch: () => void;
	reasoningEffort: ReasoningEffort;
	setReasoningEffort: (effort: ReasoningEffort) => void;
}

export const useChatFeatures = create<ChatFeatureState>()(
	persist(
		// This is the function that defines your store's initial state and actions.
		// It takes 'set' (and optionally 'get') as arguments.
		(set) => ({
			// This entire block is an object literal being returned by the function.
			// It contains:

			// 1. Initial state properties:
			isSearchEnabled: false,
			reasoningEffort: "medium",

			// 2. Action functions:
			toggleSearch: () =>
				set((state) => ({ isSearchEnabled: !state.isSearchEnabled })),
			setReasoningEffort: (effort: ReasoningEffort) =>
				set({ reasoningEffort: effort }),
		}),
		{
			name: "chat-feature-storage",
			storage: createJSONStorage(() => localStorage),
		}
	)
);
