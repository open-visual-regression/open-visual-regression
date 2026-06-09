import { Typography } from "@ovr/ui/components/typography";
import { NewProjectForm } from "./_components/new-project-form/NewProjectForm";

export default function CreateProjectPage() {
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
