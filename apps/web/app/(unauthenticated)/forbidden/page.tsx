import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getAuthConfig } from "@/lib/auth/config";
import { verifyProxyToken } from "@/lib/auth/proxyToken";
import { FORBIDDEN_REASONS, type ForbiddenReason } from "@/lib/utils/redirects";

import { CenteredFormSection } from "../_components/CenteredFormSection";
import { ForbiddenCard } from "./_components/forbidden-card/ForbiddenCard";

export const dynamic = "force-dynamic";

type ForbiddenPageProps = PageProps<"/forbidden">;

const toReason = (reason: unknown): ForbiddenReason =>
  FORBIDDEN_REASONS.find((known) => known === reason) ?? "no-role";

export default async function ForbiddenPage(props: ForbiddenPageProps) {
  const config = getAuthConfig();

  if (config.mode !== "trusted-proxy") {
    notFound();
  }

  const [{ reason }, [, identity]] = await Promise.all([
    props.searchParams,
    verifyProxyToken(await headers(), config),
  ]);

  return (
    <CenteredFormSection>
      <ForbiddenCard
        reason={toReason(reason)}
        email={identity?.email}
        accessRequestUrl={config.accessRequestUrl}
      />
    </CenteredFormSection>
  );
}
