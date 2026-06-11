"use client";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { tableDevtoolsPlugin } from "@tanstack/react-table-devtools";

export const DevTools = () => {
  return <TanStackDevtools plugins={[tableDevtoolsPlugin()]} />;
};
