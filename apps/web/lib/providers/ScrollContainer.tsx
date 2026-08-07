"use client";

import { createContext, use, useState } from "react";

const ScrollContainerContext = createContext<HTMLElement | null>(null);

/** The nearest scrollable region, or null when rendered outside one. */
export const useScrollContainer = () => use(ScrollContainerContext);

export const ScrollContainer = ({ children, ...props }: React.ComponentProps<"main">) => {
  const [element, setElement] = useState<HTMLElement | null>(null);

  return (
    <main ref={setElement} {...props}>
      <ScrollContainerContext value={element}>{children}</ScrollContainerContext>
    </main>
  );
};
