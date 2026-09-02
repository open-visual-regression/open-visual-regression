import React from "react";

import { Typography } from "@ovr/ui/components/typography";

import { LogoFull } from "@/lib/components/logo/Logo";
import { APP_VERSION } from "@/lib/utils/version";

type CenteredFormSectionProps = {
  children: React.ReactNode;
};

export const CenteredFormSection = ({ children }: CenteredFormSectionProps) => (
  <div className="flex-1 flex flex-row justify-center items-center py-6 md:py-12 px-8">
    <div className="w-full max-w-115 flex flex-col items-center gap-6">
      <LogoFull />
      {children}
      <Typography variant="caption">open visual regression · v{APP_VERSION}</Typography>
    </div>
  </div>
);
