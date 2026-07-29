"use client";

import { createContext, useContext } from "react";

type TableRowLinkContextValue = {
  href: string;
  label: string;
  labelColumnId: string;
};

const TableRowLinkContext = createContext<TableRowLinkContextValue | null>(null);

export const useTableRowLinkContext = () => {
  const context = useContext(TableRowLinkContext);

  if (!context) {
    throw new Error("TableRowLinkCell must be used within a TableRowLink");
  }

  return context;
};

export { TableRowLinkContext };
export type { TableRowLinkContextValue };
