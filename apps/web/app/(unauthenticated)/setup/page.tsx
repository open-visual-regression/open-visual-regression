import { redirect } from "next/navigation";
import { getIsSetupComplete } from "@/lib/services/setup";
import { SetupCard } from "./_components/setup-card/SetupCard";
import { CenteredFormSection } from "../_components/CenteredFormSection";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const isSetupComplete = await getIsSetupComplete();

  console.log(isSetupComplete);

  if (isSetupComplete) {
    redirect("/login");
  }

  return (
    <CenteredFormSection>
      <SetupCard />
    </CenteredFormSection>
  );
}
