import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import { ApiKeysTable } from "./ApiKeysTable";
import { NoApiKeysSection } from "./NoApiKeysSection";
import { type ApiKeySchema } from "@ovr/api/contracts/apiKeys";
import { CreateApiKeyModal } from "../create-api-key/CreateApiKeyModal";
import { CreateApiKeyModalButton } from "../create-api-key/CreateApiKeyModalButton";

type ApiKeysSectionProps = {
  projectId: string;
  apiKeys: ApiKeySchema[];
};

export const ApiKeysSection = ({ projectId, apiKeys }: ApiKeysSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <Typography variant="h2">api keys</Typography>
      <CreateApiKeyModal
        projectId={projectId}
        trigger={
          <CreateApiKeyModalButton>
            <Icon icon={PlusIcon} />
            new api key
          </CreateApiKeyModalButton>
        }
      />
    </div>
    {apiKeys.length === 0 ? <NoApiKeysSection /> : <ApiKeysTable data={apiKeys} />}
  </div>
);
