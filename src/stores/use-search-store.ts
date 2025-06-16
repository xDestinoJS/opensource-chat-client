import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SearchState {
	isSearchEnabled: boolean;
	toggleSearch: () => void;
}

export const useSearchStore = create<SearchState>()(
	persist(
		(set) => ({
			isSearchEnabled: false, // Initial state
			toggleSearch: () =>
				set((state) => ({ isSearchEnabled: !state.isSearchEnabled })),
		}),
		{
			name: "search-storage", // unique name
			storage: createJSONStorage(() => localStorage),
		}
	)
);
