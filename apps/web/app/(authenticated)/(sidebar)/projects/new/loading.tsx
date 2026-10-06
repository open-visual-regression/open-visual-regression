import { NewProjectFormSkeleton } from "./_components/new-project-form/NewProjectForm";
import { NewProjectPageShell } from "./_components/NewProjectPageShell";

export default function Loading() {
  return (
    <NewProjectPageShell>
      <NewProjectFormSkeleton />
    </NewProjectPageShell>
  );
}
