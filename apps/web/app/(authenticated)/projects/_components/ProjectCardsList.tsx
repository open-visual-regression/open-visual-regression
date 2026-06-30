import { ProjectDto } from "@ovr/api/contracts/projects";

import { ProjectCardListItem } from "./ProjectCardListItem";

type ProjectCardsListProps = {
  projects: ProjectDto[];
};

export const ProjectCardsList = ({ projects }: ProjectCardsListProps) => {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCardListItem key={project.id} project={project} />
      ))}
    </ul>
  );
};
