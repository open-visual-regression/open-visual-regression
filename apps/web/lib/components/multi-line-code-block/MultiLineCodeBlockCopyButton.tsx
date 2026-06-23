"use client";

import { type ComponentProps } from "react";
import { CopyButton } from "../copy-button/CopyButton";
import { useMultiLineCodeBlockContext } from "./MultiLineCodeBlockContext";

type MultiLineCodeBlockCopyButtonProps = Omit<ComponentProps<typeof CopyButton>, "text">;

export const MultiLineCodeBlockCopyButton = ({
  className,
  ...props
}: MultiLineCodeBlockCopyButtonProps) => {
  const { lines } = useMultiLineCodeBlockContext();

  return <CopyButton text={lines.join("\n")} className={className} {...props} />;
};
