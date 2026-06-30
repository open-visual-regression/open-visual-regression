"use client";

import { Skeleton } from "@ovr/ui/components/skeleton";
import { cn } from "@ovr/ui/lib/utils";
import { useState } from "react";

export type ImageProps = React.ComponentProps<"img"> & {
  errorFallback: React.ReactNode;
};

export const Image = ({ errorFallback, className, onLoad, onError, ...props }: ImageProps) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  if (status === "error") {
    return <>{errorFallback}</>;
  }

  return (
    <>
      <img
        {...props}
        ref={(img) => {
          if (img?.complete) {
            setStatus(img.naturalWidth > 0 ? "loaded" : "error");
          }
        }}
        className={cn(className, status === "loading" && "invisible")}
        onLoad={(event) => {
          setStatus("loaded");
          onLoad?.(event);
        }}
        onError={(event) => {
          setStatus("error");
          onError?.(event);
        }}
      />
      {status === "loading" && <Skeleton className="absolute inset-0" />}
    </>
  );
};
