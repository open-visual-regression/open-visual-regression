import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

// Positions are per history entry, then per scroll container.
type ScrollPositionState = {
  entries: Record<string, Record<string, number>>;
  save: (entryKey: string, containerId: string, offset: number) => void;
};

const MAX_TRACKED_ENTRIES = 30;

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useScrollPositionStore = create<ScrollPositionState>()(
  devtools(
    persist(
      (set) => ({
        entries: {},
        save: (entryKey, containerId, offset) =>
          set((state) => {
            const entries = {
              ...state.entries,
              [entryKey]: { ...state.entries[entryKey], [containerId]: offset },
            };

            const keys = Object.keys(entries);
            for (const stale of keys.slice(0, Math.max(0, keys.length - MAX_TRACKED_ENTRIES))) {
              delete entries[stale];
            }

            return { entries };
          }),
      }),
      {
        name: "ovr-scroll-positions",
        storage: createJSONStorage(() =>
          typeof window === "undefined" ? noopStorage : sessionStorage,
        ),
      },
    ),
    { name: "scroll-positions" },
  ),
);
