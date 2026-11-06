import type { ReactNode } from "react";

import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

type MetadataItemProps = {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
};

export const MetadataItem = ({ icon, children, className }: MetadataItemProps) => (
  <Typography variant="caption" className={cn("flex items-center gap-1", className)}>
    {icon}
    {children}
  </Typography>
);
