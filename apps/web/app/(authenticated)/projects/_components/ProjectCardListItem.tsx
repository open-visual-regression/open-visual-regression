import { ProjectDto } from "@ovr/api/contracts/projects";
import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { FolderIcon, GitBranchIcon, Icon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import Link from "next/link";

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "./DescriptionList";

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
              {project.description ? (
                <Typography variant="body-muted">{project.description}</Typography>
              ) : null}
              <DescriptionList>
                <DescriptionListItem>
                  <DescriptionTerm>
                    <Typography variant="body-muted">runs:</Typography>
                  </DescriptionTerm>
                  <DescriptionDetails>
                    <Typography variant="body">0</Typography>
                  </DescriptionDetails>
                </DescriptionListItem>
                <DescriptionListItem>
                  <DescriptionTerm>
                    <Typography variant="body-muted">baseline:</Typography>
                  </DescriptionTerm>
                  <DescriptionDetails>
                    <Icon icon={GitBranchIcon} size={12} />
                    <Typography variant="body">{project.gitMainBranch}</Typography>
                  </DescriptionDetails>
                </DescriptionListItem>
              </DescriptionList>
            </div>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
};
