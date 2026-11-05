import { TypographySkeleton } from "@ovr/ui/components/typography";

import { AccessTokensSectionSkeleton } from "./_components/access-tokens-section/AccessTokensSection";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <div className="flex w-full flex-col gap-6 md:w-3/4 lg:w-2/3">
        <AccessTokensSectionSkeleton />
      </div>
    </div>
  );
}
