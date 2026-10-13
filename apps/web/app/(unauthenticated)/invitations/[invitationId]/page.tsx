import { redirect, notFound } from "next/navigation";

import { usesTrustedProxy } from "@/lib/auth/config";
import { getCachedSession } from "@/lib/auth/session";
import { serverClient } from "@/lib/router";

import { CenteredFormSection } from "../../_components/CenteredFormSection";
import { InvitationCard } from "./_components/invitation-card/InvitationCard";

export const dynamic = "force-dynamic";

type InvitationPageProps = PageProps<"/invitations/[invitationId]">;

export default async function InvitationPage(props: InvitationPageProps) {
  if (usesTrustedProxy()) {
    notFound();
  }

  const { invitationId } = await props.params;

  const [[error, invitation], session] = await Promise.all([
    serverClient.invitations.getInvitation({ invitationId }),
    getCachedSession(),
  ]);

  if (session) {
    redirect("/projects");
  }

  if (error || !invitation) {
    notFound();
  }

  return (
    <CenteredFormSection>
      <InvitationCard
        invitationId={invitationId}
        email={invitation.email}
        organizationName={invitation.organizationName}
        role={invitation.role}
      />
    </CenteredFormSection>
  );
}
