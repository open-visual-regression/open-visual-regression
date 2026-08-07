"use client";

import { ComponentProps, createContext, ElementType, use, useState } from "react";

const ScrollContainerContext = createContext<HTMLElement | null>(null);

/** The nearest scrollable region, or null when rendered outside one. */
export const useScrollContainer = () => use(ScrollContainerContext);

type ScrollContainerProps<T extends ElementType> = {
  as?: T;
  children?: React.ReactNode;
} & Omit<ComponentProps<T>, "as" | "children" | "ref">;

export const ScrollContainer = <T extends ElementType = "div">({
  as,
  children,
  ...props
}: ScrollContainerProps<T>) => {
  const Component = as ?? "div";
  const [element, setElement] = useState<HTMLElement | null>(null);

  return (
    <Component ref={setElement} {...props}>
      <ScrollContainerContext value={element}>{children}</ScrollContainerContext>
    </Component>
  );
};
