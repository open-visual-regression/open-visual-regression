"use client";

import { PixelGrid } from "@ovr/ui/components/pixel-grid";
import { Typography } from "@ovr/ui/components/typography";

import { APP_VERSION } from "@/lib/utils/version";

export default function Error() {
  return (
    <PixelGrid className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-row justify-center items-center py-6 md:py-12 px-8">
        <div className="w-full flex flex-col items-center gap-6">
          <Typography variant="display">Something went wrong.</Typography>
          <Typography variant="body">Please try again later.</Typography>
          <Typography variant="caption">open visual regression · v{APP_VERSION}</Typography>
        </div>
      </div>
    </PixelGrid>
  );
}
