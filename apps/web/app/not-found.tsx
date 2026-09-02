import { PixelGrid } from "@ovr/ui/components/pixel-grid";
import { Typography } from "@ovr/ui/components/typography";

import { APP_VERSION } from "@/lib/utils/version";

export default function NotFoundPage() {
  return (
    <PixelGrid className="min-h-screen flex flex-col w-full">
      <div className="flex-1 flex flex-row justify-center items-center py-6 md:py-12 px-8">
        <div className="w-full max-w-115 flex flex-col items-center gap-6">
          <Typography variant="display" as="h1">
            Not found
          </Typography>
          <Typography variant="body-muted">The requested page could not be found.</Typography>
          <Typography variant="caption">open visual regression · v{APP_VERSION}</Typography>
        </div>
      </div>
    </PixelGrid>
  );
}
