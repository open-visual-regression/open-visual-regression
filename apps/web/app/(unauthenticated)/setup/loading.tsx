import { CenteredFormSection } from "../_components/CenteredFormSection";
import { SetupCardSkeleton } from "./_components/setup-card/SetupCard";

export default function Loading() {
  return (
    <CenteredFormSection>
      <SetupCardSkeleton />
    </CenteredFormSection>
  );
}
