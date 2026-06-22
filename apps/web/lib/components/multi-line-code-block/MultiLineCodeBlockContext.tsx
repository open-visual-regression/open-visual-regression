"use client";

import { createContext, useContext } from "react";

type MultiLineCodeBlockContextValue = {
  lines: string[];
  wrap: boolean;
  showLineNumbers: boolean;
};

const MultiLineCodeBlockContext = createContext<MultiLineCodeBlockContextValue | null>(null);

export const useMultiLineCodeBlockContext = () => {
  const context = useContext(MultiLineCodeBlockContext);

  if (!context) {
    throw new Error("MultiLineCodeBlock components must be used within a MultiLineCodeBlock");
  }

  return context;
};

export { MultiLineCodeBlockContext };
export type { MultiLineCodeBlockContextValue };
