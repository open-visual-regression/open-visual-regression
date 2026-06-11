import { Button } from "@ovr/ui/components/button";
import { Icon, PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";
import { ApiKeysTable } from "./ApiKeysTable";
import { NoApiKeysSection } from "./NoApiKeysSection";
import { type ApiKeySchema } from "@ovr/api/contracts/apiKeys";

type ApiKeysSectionProps = {
  apiKeys: ApiKeySchema[];
};

export const ApiKeysSection = ({ apiKeys }: ApiKeysSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <Typography variant="h2">api keys</Typography>
      <Button>
        <Icon icon={PlusIcon} />
        new api key
      </Button>
    </div>
    {apiKeys.length === 0 ? <NoApiKeysSection /> : <ApiKeysTable data={apiKeys} />}
  </div>
);
