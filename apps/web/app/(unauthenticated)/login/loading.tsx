import { CenteredFormSection } from "../_components/CenteredFormSection";
import { LoginCardSkeleton } from "./_components/login-card/LoginCard";

export default function Loading() {
  return (
    <CenteredFormSection>
      <LoginCardSkeleton />
    </CenteredFormSection>
  );
}
