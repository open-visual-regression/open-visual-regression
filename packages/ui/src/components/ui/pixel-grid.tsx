import { cn } from "../../lib/utils";

type PixelGridProps = {
  children?: React.ReactNode;
  className?: string;
};

const PixelGrid = ({ children, className }: PixelGridProps) => {
  return <div className={cn("bg-background bg-pixel-grid", className)}>{children}</div>;
};

export { PixelGrid };
export type { PixelGridProps };
