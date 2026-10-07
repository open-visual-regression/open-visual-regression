import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { usesTrustedProxy } from "@/lib/auth/config";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { CenteredFormSection } from "../_components/CenteredFormSection";
import { SetupCard } from "./_components/setup-card/SetupCard";

export default async function SetupPage() {
  await connection();

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
