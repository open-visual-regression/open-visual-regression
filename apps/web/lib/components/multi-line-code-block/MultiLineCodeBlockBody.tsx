"use client";

import { cn } from "@ovr/ui/lib/utils";
import { JSX } from "react";
import { useMultiLineCodeBlockContext } from "./MultiLineCodeBlockContext";

type MultiLineCodeBlockBodyProps = JSX.IntrinsicElements["div"];

export const MultiLineCodeBlockBody = ({
  className,
  children,
  ...props
}: MultiLineCodeBlockBodyProps) => {
  const { wrap } = useMultiLineCodeBlockContext();

  return (
    <div
      {...props}
      className={cn("py-2", wrap ? "overflow-x-hidden" : "overflow-x-auto", className)}
    >
      {children}
    </div>
  );
};
