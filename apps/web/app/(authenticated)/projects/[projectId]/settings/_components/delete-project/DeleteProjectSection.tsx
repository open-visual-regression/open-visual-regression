import { type ProjectDto } from "@ovr/api/contracts/projects";
import { Typography } from "@ovr/ui/components/typography";

import { DeleteProjectDialog } from "./DeleteProjectDialog";

type DeleteProjectSectionProps = {
  project: ProjectDto;
};

export const DeleteProjectSection = ({ project }: DeleteProjectSectionProps) => (
  <div className="flex flex-col gap-4">
    <Typography variant="label" className="text-ovr-remove">
      danger zone
    </Typography>
    <div className="flex flex-col gap-4 rounded-lg border border-ovr-remove p-4 sm:flex-row sm:items-center sm:justify-between">
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
