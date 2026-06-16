import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";
import { AddCaptureConfigurationModal } from "../add-capture-configuration/AddCaptureConfigurationModal";
import { AddCaptureConfigurationModalButton } from "../add-capture-configuration/AddCaptureConfigurationModalButton";

type NoCaptureConfigurationsSectionProps = {
  projectId: string;
};

export const NoCaptureConfigurationsSection = ({
  projectId,
}: NoCaptureConfigurationsSectionProps) => (
  <Card className="bg-pixel-grid py-20">
    <CardHeader className="flex justify-center">
      <Typography variant="h2" as="h2">
        no capture configurations yet
      </Typography>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center gap-6">
      <Typography variant="caption" className="text-sm">
        capture configurations define the browser and viewport used to take screenshots.
      </Typography>
      <AddCaptureConfigurationModal
        projectId={projectId}
        trigger={
          <AddCaptureConfigurationModalButton variant="default" size="lg">
            <Icon icon={PlusIcon} />
            add first configuration
          </AddCaptureConfigurationModalButton>
        }
      />
    </CardContent>
  </Card>
);
