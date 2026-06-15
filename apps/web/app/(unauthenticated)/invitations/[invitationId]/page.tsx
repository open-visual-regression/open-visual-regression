import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { CenteredFormSection } from "../../_components/CenteredFormSection";
import { InvitationCard } from "./_components/invitation-card/InvitationCard";
import { InvitationInvalidCard } from "./_components/invitation-card/InvitationInvalidCard";

export const dynamic = "force-dynamic";

type InvitationPageProps = PageProps<"/invitations/[invitationId]">;

export default async function InvitationPage(props: InvitationPageProps) {
  const { invitationId } = await props.params;

  const [[error, invitation], session] = await Promise.all([
    serverClient.invitations.getInvitation({ invitationId }),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (session) {
    redirect("/projects");
  }

  if (error || !invitation) {
    return (
      <CenteredFormSection>
        <InvitationInvalidCard />
      </CenteredFormSection>
    );
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
