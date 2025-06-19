import { create } from "zustand";
import { Doc } from "../../convex/_generated/dataModel";

type AgentModalStore = {
	isOpen: boolean;
	agent: Doc<"agents"> | null;
	open: () => void;
	close: () => void;
	setAgent: (agent: Doc<"agents"> | undefined | null) => void;
};

export const useAgentModalStore = create<AgentModalStore>((set) => ({
	isOpen: false,
	agent: null,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false, agent: null }),
	setAgent: (agent: Doc<"agents"> | undefined | null) => set({ agent: agent }),
}));
