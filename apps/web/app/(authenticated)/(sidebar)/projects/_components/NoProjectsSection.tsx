import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { RequiresAdminRole } from "@/lib/components/authorization/RequiresAdminRole";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

type NoProjectsSectionProps = {
  role: string | null | undefined;
};

export const NoProjectsSection = ({ role }: NoProjectsSectionProps) => (
  <Card className="bg-pixel-grid py-20">
    <CardHeader className="flex justify-center">
      <Typography variant="h2" as="h2">
        No projects yet
      </Typography>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center gap-6">
      <Typography variant="caption" className="text-sm">
        Create a project to start running visual regression tests.
      </Typography>
      <RequiresAdminRole role={role}>
        <ButtonLink href="/projects/new" size="lg">
          <Icon icon={PlusIcon} />
          Create first project
        </ButtonLink>
      </RequiresAdminRole>
    </CardContent>
  </Card>
);
