import { create } from "zustand";

type SessionIdStore = {
	sessionId: string;
	reset: () => void;
};

const useSessionId = create<SessionIdStore>((set) => ({
	sessionId: crypto.randomUUID(),
	reset: () => set({ sessionId: crypto.randomUUID() }),
}));

export default useSessionId;
