import { ComponentProps, ElementType } from "react";

import { cn } from "@ovr/ui/lib/utils";

type TruncatedTextProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentProps<T>, "as" | "className">;

export const TruncatedText = <T extends ElementType = "span">({
  as,
  className,
  ...props
}: TruncatedTextProps<T>) => {
  const Component = as ?? "span";

  return <Component className={cn("max-w-[24ch] truncate", className)} {...props} />;
};
