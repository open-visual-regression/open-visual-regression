import { AccessTokensSectionSkeleton } from "./_components/access-tokens-section/AccessTokensSection";
import { AccessTokensPageShell } from "./_components/AccessTokensPageShell";

export default function Loading() {
  return (
    <AccessTokensPageShell>
      <AccessTokensSectionSkeleton />
    </AccessTokensPageShell>
  );
}
