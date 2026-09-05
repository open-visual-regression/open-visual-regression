"use client";

import { useState } from "react";

import { Skeleton } from "@ovr/ui/components/skeleton";
import { cn } from "@ovr/ui/lib/utils";

export type ImageProps = React.ComponentProps<"img"> & {
  errorFallback: React.ReactNode;
  /** Runs once the image has loaded, including when it was cached before mount. */
  onLoaded?: (image: HTMLImageElement) => void;
};

export const Image = ({
  errorFallback,
  className,
  onLoad,
  onError,
  onLoaded,
  ...props
}: ImageProps) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  if (status === "error") {
    return <>{errorFallback}</>;
  }

  return (
    <>
      <img
        {...props}
        ref={(img) => {
          if (img?.complete && status === "loading") {
            setStatus(img.naturalWidth > 0 ? "loaded" : "error");
            if (img.naturalWidth > 0) {
              onLoaded?.(img);
            }
          }
        }}
        className={cn(className, status === "loading" && "invisible")}
        onLoad={(event) => {
          setStatus("loaded");
          onLoaded?.(event.currentTarget);
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
