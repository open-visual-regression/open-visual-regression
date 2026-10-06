import { CenteredFormSection } from "../../_components/CenteredFormSection";
import { InvitationCardSkeleton } from "./_components/invitation-card/InvitationCard";

export default function Loading() {
  return (
    <CenteredFormSection>
      <InvitationCardSkeleton />
    </CenteredFormSection>
  );
}
