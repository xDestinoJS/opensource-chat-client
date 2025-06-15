// stores/useModelFilters.ts
import { create } from "zustand";
import { ModelFeatureId } from "@/lib/features";

const LOCAL_STORAGE_KEY = "modelFilters";

type ModelFilterStore = {
	enabledFilters: ModelFeatureId[];
	toggleFilter: (id: ModelFeatureId) => void;
	clearFilters: () => void;
	loadFromLocalStorage: () => void;
};

export const useModelFilters = create<ModelFilterStore>((set, get) => ({
	enabledFilters: [],

	toggleFilter: (id) => {
		const current = get().enabledFilters;
		const updated = current.includes(id)
			? current.filter((f) => f !== id)
			: [...current, id];

		set({ enabledFilters: updated });
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
	},

	clearFilters: () => {
		set({ enabledFilters: [] });
		localStorage.removeItem(LOCAL_STORAGE_KEY);
	},

	loadFromLocalStorage: () => {
		if (typeof window === "undefined") return;

		const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					set({ enabledFilters: parsed });
				}
			} catch {
				// ignore parsing error
			}
		}
	},
}));
