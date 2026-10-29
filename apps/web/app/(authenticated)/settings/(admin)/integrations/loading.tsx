import { TypographySkeleton } from "@ovr/ui/components/typography";

import { GitProviderConnectionsSectionSkeleton } from "./_components/git-provider-connections/GitProviderConnectionsSectionSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <GitProviderConnectionsSectionSkeleton />
    </div>
  );
}
