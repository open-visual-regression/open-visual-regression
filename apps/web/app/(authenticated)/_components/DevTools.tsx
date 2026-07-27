"use client";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { tableDevtoolsPlugin } from "@tanstack/react-table-devtools";

export const DevTools = () => {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      <TanStackDevtools plugins={[tableDevtoolsPlugin()]} />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
};
