import { type ApiKeySchema } from "@ovr/api/contracts/apiKeys";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { CreateApiKeyModal } from "../create-api-key/CreateApiKeyModal";
import { CreateApiKeyModalButton } from "../create-api-key/CreateApiKeyModalButton";
import { ApiKeysTable, ApiKeysTableSkeleton } from "./ApiKeysTable";
import { NoApiKeysSection } from "./NoApiKeysSection";

type ApiKeysSectionProps = {
  projectId: string;
  apiKeys: ApiKeySchema[];
};

export const ApiKeysSection = ({ projectId, apiKeys }: ApiKeysSectionProps) => (
  <CreateApiKeyModal projectId={projectId}>
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Typography variant="h2">api keys</Typography>
        <CreateApiKeyModalButton>
          <Icon icon={PlusIcon} />
          new api key
        </CreateApiKeyModalButton>
      </div>
      {apiKeys.length === 0 ? <NoApiKeysSection /> : <ApiKeysTable data={apiKeys} />}
    </div>
  </CreateApiKeyModal>
);

export const ApiKeysSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <TypographySkeleton variant="h2" className="w-24" />
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
    <ApiKeysTableSkeleton />
  </div>
);
