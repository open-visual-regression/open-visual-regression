import { redirect } from "next/navigation";
import { getIsSetupComplete } from "@/lib/services/setup";
import { CenteredFormSection } from "../_components/CenteredFormSection";
import { LoginCard } from "./_components/login-card/LoginCard";

export default async function LoginPage() {
  const isSetupComplete = await getIsSetupComplete();

  if (!isSetupComplete) {
    redirect("/setup");
  }

  return (
    <CenteredFormSection>
      <LoginCard />
    </CenteredFormSection>
  );
}
