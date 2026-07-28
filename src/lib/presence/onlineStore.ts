import { create } from "zustand";

interface OnlineState {
  onlineCount: number;
  setOnlineCount: (count: number) => void;
}

/**
 * Site-wide online player count, written by PresenceTracker (mounted in the
 * root layout) and read by any component that wants to display it.
 */
export const useOnlineStore = create<OnlineState>((set) => ({
  onlineCount: 0,
  setOnlineCount: (count) => set({ onlineCount: count }),
}));
