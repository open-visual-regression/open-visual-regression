import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";
import { CreateApiKeyModal } from "../create-api-key/CreateApiKeyModal";
import { CreateApiKeyModalButton } from "../create-api-key/CreateApiKeyModalButton";

type NoApiKeysSectionProps = {
  projectId: string;
};

export const NoApiKeysSection = ({ projectId }: NoApiKeysSectionProps) => (
  <Card className="bg-pixel-grid py-20">
    <CardHeader className="flex justify-center">
      <Typography variant="h2" as="h2">
        no api keys yet
      </Typography>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center gap-6">
      <Typography variant="caption" className="text-sm">
        api keys are required to upload snapshots to this project.
      </Typography>
      <CreateApiKeyModal
        projectId={projectId}
        trigger={
          <CreateApiKeyModalButton variant="default" size="lg">
            <Icon icon={PlusIcon} />
            create first api key
          </CreateApiKeyModalButton>
        }
      />
    </CardContent>
  </Card>
);
