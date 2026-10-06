import { TypographySkeleton } from "@ovr/ui/components/typography";

import { NewProjectFormSkeleton } from "./_components/new-project-form/NewProjectForm";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 w-full lg:w-1/2">
      <div className="flex justify-between items-center">
        <TypographySkeleton variant="h1" className="w-40" />
      </div>
      <NewProjectFormSkeleton />
    </div>
  );
}
