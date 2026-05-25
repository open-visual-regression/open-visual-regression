import { cn } from "../../lib/utils";

const AspectRatio = ({
  ratio,
  className,
  ...props
}: React.ComponentProps<"div"> & { ratio: number }) => {
  return (
    <div
      data-slot="aspect-ratio"
      // oxlint-disable-next-line react/forbid-dom-props
      style={{ "--ratio": ratio } as React.CSSProperties}
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  );
};

export { AspectRatio };
