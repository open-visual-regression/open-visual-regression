import { TypographySkeleton } from "@ovr/ui/components/typography";

import { BuildsListSkeleton } from "@/lib/components/builds-section/BuildsList";

import { BuildsPageShell } from "./_components/BuildsPageShell";

export default function Loading() {
  return (
    <BuildsPageShell
      heading={<TypographySkeleton variant="h1" className="w-24" />}
      content={<BuildsListSkeleton />}
    />
  );
}
