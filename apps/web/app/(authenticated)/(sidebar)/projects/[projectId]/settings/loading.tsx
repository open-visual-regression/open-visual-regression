import { TypographySkeleton } from "@ovr/ui/components/typography";

import { ApiKeysSectionSkeleton } from "./_components/api-keys-section/ApiKeysSection";
import { DeleteProjectSectionSkeleton } from "./_components/delete-project/DeleteProjectSection";
import { GitIntegrationSectionSkeleton } from "./_components/git-integration/GitIntegrationSection";
import { UpdateProjectFormSkeleton } from "./_components/update-project-form/UpdateProjectForm";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <TypographySkeleton variant="h1" className="w-40" />
      <div className="flex flex-col gap-6 w-full md:w-3/4 lg:w-2/3">
        <UpdateProjectFormSkeleton />
        <GitIntegrationSectionSkeleton />
        <ApiKeysSectionSkeleton />
        <DeleteProjectSectionSkeleton />
      </div>
    </div>
  );
}
