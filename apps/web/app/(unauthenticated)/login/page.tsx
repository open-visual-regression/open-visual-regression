import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { CenteredFormSection } from "../_components/CenteredFormSection";
import { LoginCard } from "./_components/login-card/LoginCard";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [[error, setupStatusResult], session] = await Promise.all([
    serverClient.setup.status(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (error) {
    serverError(error);
  }

  if (setupStatusResult.status === "pending") {
    redirect("/setup");
  }

  if (session) {
    redirect("/projects");
  }

  return (
    <CenteredFormSection>
      <LoginCard />
    </CenteredFormSection>
  );
}
