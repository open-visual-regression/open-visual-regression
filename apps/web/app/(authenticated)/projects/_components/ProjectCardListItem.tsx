import { ProjectDto } from "@ovr/api/contracts/projects";
import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { FolderIcon, GitBranchIcon, Icon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import Link from "next/link";

type ProjectCardListItemProps = {
  project: ProjectDto;
};

export const ProjectCardListItem = ({ project }: ProjectCardListItemProps) => {
  return (
    <li>
      {/* @todo: we need to update the styles when the user hovers over the card for accessibility */}
      <Link href={`/projects/${project.id}`}>
        <Card>
          <CardHeader>
            <Typography variant="h3" className="flex flex-row gap-3 items-center">
              <Icon icon={FolderIcon} />
              {project.name}
            </Typography>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="body-muted">{project.description}</Typography>
              </div>
              <div>
                <dl className="flex flex-row gap-6 items-center">
                  <div className="flex flex-row gap-2 items-center">
                    <dt>
                      <Typography variant="body-muted">runs:</Typography>
                    </dt>
                    <dd>
                      <Typography variant="body-muted">0</Typography>
                    </dd>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <dt>
                      <Typography variant="body-muted">baseline:</Typography>
                    </dt>
                    <dd className="flex flex-row gap-1 items-center">
                      <Icon icon={GitBranchIcon} size={12} />
                      <Typography variant="body-muted">{project.gitMainBranch}</Typography>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
};
