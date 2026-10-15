import type { ReactNode } from "react";

import { Typography } from "@ovr/ui/components/typography";

type MetadataItemProps = {
  icon: ReactNode;
  children: ReactNode;
};

export const MetadataItem = ({ icon, children }: MetadataItemProps) => (
  <Typography variant="caption" className="flex items-center gap-1">
    {icon}
    {children}
  </Typography>
);
