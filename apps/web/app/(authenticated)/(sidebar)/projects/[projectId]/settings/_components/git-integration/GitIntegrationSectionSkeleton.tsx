import { TypographySkeleton } from "@ovr/ui/components/typography";

import { GitIntegrationFormSkeleton } from "./GitIntegrationFormSkeleton";

export const GitIntegrationSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <TypographySkeleton variant="h2" className="w-40" />
    <GitIntegrationFormSkeleton />
  </div>
);
