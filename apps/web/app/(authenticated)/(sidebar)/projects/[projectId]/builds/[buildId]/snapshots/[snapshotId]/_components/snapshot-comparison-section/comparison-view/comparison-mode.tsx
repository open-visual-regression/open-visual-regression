"use client";

import { createContext, useContext, useState } from "react";

export type ViewMode = "split" | "slider";

type ComparisonMode = {
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  showDiff: boolean;
  setShowDiff: (showDiff: boolean) => void;
};

const ComparisonModeContext = createContext<ComparisonMode | null>(null);

export const ComparisonModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [showDiff, setShowDiff] = useState(true);

  return (
    <ComparisonModeContext.Provider value={{ viewMode, setViewMode, showDiff, setShowDiff }}>
      {children}
    </ComparisonModeContext.Provider>
  );
};

export const useComparisonMode = () => {
  const context = useContext(ComparisonModeContext);

  if (!context) {
    throw new Error("useComparisonMode must be used within a ComparisonModeProvider");
  }

  return context;
};
