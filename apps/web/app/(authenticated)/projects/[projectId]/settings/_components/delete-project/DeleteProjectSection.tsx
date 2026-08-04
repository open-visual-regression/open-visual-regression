import { type ProjectDto } from "@ovr/api/contracts/projects";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { DeleteProjectDialog } from "./DeleteProjectDialog";

type DeleteProjectSectionProps = {
  project: ProjectDto;
};

export const DeleteProjectSection = ({ project }: DeleteProjectSectionProps) => (
  <div className="flex flex-col gap-4">
    <Typography variant="label" className="text-ovr-remove">
      danger zone
    </Typography>
    <div className="flex flex-col items-start gap-4 rounded-lg border border-ovr-remove p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1">
        <Typography>delete project</Typography>
        <Typography variant="body-muted">
          permanently deletes this project and everything stored for it. this cannot be undone.
        </Typography>
      </div>
      <DeleteProjectDialog project={project} />
    </div>
  </div>
);

export const DeleteProjectSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <TypographySkeleton variant="label" className="w-24" />
    <div className="flex flex-col items-start gap-4 rounded-lg border border-ovr-remove p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1">
        <TypographySkeleton className="w-28" />
        <TypographySkeleton variant="body-muted" className="w-80 max-w-full" />
      </div>
      <Skeleton className="h-8 w-32 shrink-0 rounded-lg" />
    </div>
  </div>
);
