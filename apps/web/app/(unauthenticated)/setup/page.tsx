import { redirect } from "next/navigation";
import { serverError } from "@/lib/utils/errors";
import { SetupCard } from "./_components/setup-card/SetupCard";
import { CenteredFormSection } from "../_components/CenteredFormSection";
import { serverClient } from "@/lib/router";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const [error, setupStatusResult] = await serverClient.setup.status();

  if (error) {
    serverError();
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
