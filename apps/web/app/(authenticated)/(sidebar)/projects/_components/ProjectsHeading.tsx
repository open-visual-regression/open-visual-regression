import { Typography } from "@ovr/ui/components/typography";

type ProjectsHeadingProps = {
  total: number;
};

export const ProjectsHeading = ({ total }: ProjectsHeadingProps) => (
  <div className="flex flex-row gap-2 items-end-safe">
    <Typography variant="h1" as="h1">
      projects
    </Typography>
    <Typography variant="h2" className="text-muted-foreground" as="p">
      ({total})
    </Typography>
  </div>
);
