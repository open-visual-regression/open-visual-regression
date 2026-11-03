import { TypographySkeleton } from "@ovr/ui/components/typography";

import { OverviewLinkCardSkeleton } from "../_components/OverviewLinkCard";
import { OverviewPageShell } from "../_components/OverviewPageShell";

export default function Loading() {
  return (
    <OverviewPageShell
      heading={<TypographySkeleton variant="h1" className="w-40" />}
      links={
        <>
          <OverviewLinkCardSkeleton />
          <OverviewLinkCardSkeleton />
          <OverviewLinkCardSkeleton />
        </>
      }
    />
  );
}
