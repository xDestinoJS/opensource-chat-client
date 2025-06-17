import { create } from "zustand";

type SpotlightModalStore = {
	isOpen: boolean;
	open: () => void;
	close: () => void;
};

export const useSpotlightModalStore = create<SpotlightModalStore>((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
}));
