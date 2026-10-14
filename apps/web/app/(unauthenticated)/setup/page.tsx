import { notFound, redirect } from "next/navigation";

import { usesTrustedProxy } from "@/lib/auth/config";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { CenteredFormSection } from "../_components/CenteredFormSection";
import { SetupCard } from "./_components/setup-card/SetupCard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (usesTrustedProxy()) {
    notFound();
  }

  const [error, setupStatusResult] = await serverClient.setup.status();

  if (error) {
    serverError(error);
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
