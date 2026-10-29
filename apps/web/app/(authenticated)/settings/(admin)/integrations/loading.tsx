import { TypographySkeleton } from "@ovr/ui/components/typography";

import { GithubAppSectionSkeleton } from "./_components/github-app-section/GithubAppSection";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <GithubAppSectionSkeleton />
    </div>
  );
}
