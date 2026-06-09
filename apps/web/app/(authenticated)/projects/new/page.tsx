import { verifyRole } from "@/lib/utils/authorization";
import { Typography } from "@ovr/ui/components/typography";
import { notFound, redirect } from "next/navigation";
import { NewProjectForm } from "./_components/new-project-form/NewProjectForm";

export default async function CreateProjectPage() {
  const verifyRoleResult = await verifyRole("admin");

  if (verifyRoleResult.status === "error") {
    return redirect("/error");
  }

  if (!verifyRoleResult.data) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-6 w-full lg:w-1/2">
      <div className="flex justify-between items-center">
        <Typography variant="h1" as="h1">
          new project
        </Typography>
      </div>
      <NewProjectForm />
    </div>
  );
}
