import { redirect } from "next/navigation";
import { CenteredFormSection } from "../_components/CenteredFormSection";
import { LoginCard } from "./_components/login-card/LoginCard";
import { router } from "@/lib/router";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [[error, setupStatusResult], session] = await Promise.all([
    router.setup.status(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (error) {
    redirect("/error");
  }

  if (setupStatusResult.status === "pending") {
    redirect("/setup");
  }

  if (session) {
    redirect("/");
  }

  return (
    <CenteredFormSection>
      <LoginCard />
    </CenteredFormSection>
  );
}
