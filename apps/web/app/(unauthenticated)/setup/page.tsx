import { redirect } from "next/navigation";
import { SetupCard } from "./_components/setup-card/SetupCard";
import { CenteredFormSection } from "../_components/CenteredFormSection";
import { router } from "@/lib/router";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const [error, setupStatusResult] = await router.setup.status();

  if (error) {
    redirect("/error");
  }

  if (setupStatusResult.status === "completed") {
    redirect("/login");
  }

  return (
    <CenteredFormSection>
      <SetupCard />
    </CenteredFormSection>
  );
}
