import { redirect } from "next/navigation";

import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { CenteredFormSection } from "../_components/CenteredFormSection";
import { SetupCard } from "./_components/setup-card/SetupCard";

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
