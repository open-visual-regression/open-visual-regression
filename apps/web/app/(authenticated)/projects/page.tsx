import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import { NoProjectsSection } from "./_components/NoProjectsSection";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-row gap-2 items-end-safe">
          <Typography variant="h1" as="h1">
            projects
          </Typography>
          <Typography variant="h2" className="text-muted-foreground" as="p">
            (0)
          </Typography>
        </div>
        <ButtonLink href="/projects/new" size="lg">
          <Icon icon={PlusIcon} />
          new project
        </ButtonLink>
      </div>
      <NoProjectsSection />
    </div>
  );
}
