"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/orpc/query-client";

type QueryProviderProps = {
  children: React.ReactNode;
};

export const QueryProvider = ({ children }: QueryProviderProps) => (
  <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
);
