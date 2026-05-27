import { redirect } from "next/navigation";
import { CenteredFormSection } from "../_components/CenteredFormSection";
import { LoginCard } from "./_components/login-card/LoginCard";
import { router } from "@ovr/api/router";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [error, setupStatusResult] = await router.setup.status();

  if (error) {
    redirect("/error");
  }

  if (setupStatusResult.status === "pending") {
    redirect("/setup");
  }

  return (
    <CenteredFormSection>
      <LoginCard />
    </CenteredFormSection>
  );
}
