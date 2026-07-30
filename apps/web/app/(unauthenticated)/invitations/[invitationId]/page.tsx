import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";

import { CenteredFormSection } from "../../_components/CenteredFormSection";
import { InvitationCard } from "./_components/invitation-card/InvitationCard";

export const dynamic = "force-dynamic";

type InvitationPageProps = PageProps<"/invitations/[invitationId]">;

export default async function InvitationPage(props: InvitationPageProps) {
  const { invitationId } = await props.params;

  const [[error, invitation], session] = await Promise.all([
    serverClient.invitations.getInvitation({ invitationId }),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (error || !invitation) {
    notFound();
  }

  const mode = session
    ? session.user.email === invitation.email
      ? "accept"
      : "wrongAccount"
    : invitation.hasAccount
      ? "signIn"
      : "create";

  return (
    <CenteredFormSection>
      <InvitationCard
        mode={mode}
        invitationId={invitationId}
        email={invitation.email}
        organizationName={invitation.organizationName}
        role={invitation.role}
        sessionEmail={session?.user.email ?? null}
      />
    </CenteredFormSection>
  );
}
