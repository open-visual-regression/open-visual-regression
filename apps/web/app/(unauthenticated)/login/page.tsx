import { redirect } from "next/navigation";

import { getCachedSession } from "@/lib/auth/session";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { getSafeRedirectPath, CALLBACK_URL_PARAM } from "@/lib/utils/redirects";

import { CenteredFormSection } from "../_components/CenteredFormSection";
import { LoginCard } from "./_components/login-card/LoginCard";

type LoginPageProps = PageProps<"/login">;

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;
  const redirectPath = getSafeRedirectPath(searchParams[CALLBACK_URL_PARAM]);

  const [[error, setupStatusResult], session] = await Promise.all([
    serverClient.setup.status(),
    getCachedSession(),
  ]);

  if (error) {
    serverError(error);
  }

  if (setupStatusResult.status === "pending") {
    redirect("/setup");
  }

  if (session) {
    redirect(redirectPath);
  }

  return (
    <CenteredFormSection>
      <LoginCard redirectPath={redirectPath} />
    </CenteredFormSection>
  );
}
