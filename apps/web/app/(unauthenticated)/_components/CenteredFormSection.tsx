import { Typography } from "@ovr/ui/components/typography";
import React from "react";

import { LogoFull } from "@/lib/components/logo/Logo";

type CenteredFormSectionProps = {
  children: React.ReactNode;
};

export const CenteredFormSection = ({ children }: CenteredFormSectionProps) => (
  <div className="flex-1 flex flex-row justify-center items-center py-6 md:py-12 px-8">
    <div className="w-full max-w-115 flex flex-col items-center gap-6">
      <LogoFull />
      {children}
      <Typography variant="caption">
        open visual regression · v{process.env.npm_package_version ?? "0.0.0"}
      </Typography>
    </div>
  </div>
);
