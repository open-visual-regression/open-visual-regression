import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";

import { CenteredFormSection } from "../_components/CenteredFormSection";
import { LoginCard } from "./_components/login-card/LoginCard";

export const dynamic = "force-dynamic";

type LoginPageProps = PageProps<"/login">;

const toSafeRedirect = (redirectTo: string | string[] | undefined) =>
  typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/projects";

export default async function LoginPage(props: LoginPageProps) {
  const [{ redirect: redirectParam }, [error, setupStatusResult], session] = await Promise.all([
    props.searchParams,
    serverClient.setup.status(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (error) {
    serverError();
  }

  if (setupStatusResult.status === "pending") {
    redirect("/setup");
  }

  const redirectTo = toSafeRedirect(redirectParam);

  if (session) {
    redirect(redirectTo);
  }

  return (
    <CenteredFormSection>
      <LoginCard redirectTo={redirectTo} />
    </CenteredFormSection>
  );
}
