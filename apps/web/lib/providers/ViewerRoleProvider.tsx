"use client";

import { createContext, use, useContext } from "react";

import type { Role } from "@/lib/auth/roles";

const ViewerRoleContext = createContext<Promise<Role | null> | null>(null);

type ViewerRoleProviderProps = {
  role: Promise<Role | null>;
  children: React.ReactNode;
};

export const ViewerRoleProvider = ({ role, children }: ViewerRoleProviderProps) => (
  <ViewerRoleContext.Provider value={role}>{children}</ViewerRoleContext.Provider>
);

export const useViewerRole = () => {
  const role = useContext(ViewerRoleContext);

  if (!role) {
    throw new Error("useViewerRole must be used within a ViewerRoleProvider");
  }

  return use(role);
};
