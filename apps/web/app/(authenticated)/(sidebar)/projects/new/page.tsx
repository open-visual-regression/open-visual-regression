import { notFound } from "next/navigation";

import { verifyRole } from "@/lib/utils/authorization";
import { serverError } from "@/lib/utils/errors";

import { NewProjectForm } from "./_components/new-project-form/NewProjectForm";
import { NewProjectPageShell } from "./_components/NewProjectPageShell";

export default async function CreateProjectPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    serverError(verifyRoleResult.error);
  }

  if (!verifyRoleResult.data) {
    return notFound();
  }

  return (
    <NewProjectPageShell>
      <NewProjectForm />
    </NewProjectPageShell>
  );
}
