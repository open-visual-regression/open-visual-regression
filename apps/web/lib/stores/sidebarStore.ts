import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import { setSidebarCollapsedCookie } from "./sidebarCookie";

type SidebarState = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useSidebarStore = create<SidebarState>()(
  devtools(
    persist(
      (set) => ({
        collapsed: false,
        setCollapsed: (collapsed) => {
          set({ collapsed });
          setSidebarCollapsedCookie(collapsed);
        },
      }),
      {
        name: "ovr-sidebar",
        storage: createJSONStorage(() =>
          typeof window === "undefined" ? noopStorage : localStorage,
        ),
        skipHydration: true,
      },
    ),
    { name: "sidebar" },
  ),
);
