import type { GitProviderConnectionsSchema } from "@ovr/api/contracts/gitProviders";
import { Typography } from "@ovr/ui/components/typography";

import { ConnectionsCard } from "./ConnectionsCard";
import { ConnectionsErrorCard } from "./ConnectionsErrorCard";
import { ConnectionsNotConfiguredCard } from "./ConnectionsNotConfiguredCard";

type GitProviderConnectionsSectionProps = {
  connections: GitProviderConnectionsSchema;
};

export const GitProviderConnectionsSection = ({
  connections: { providerName, label, setupGuideUrl, status },
}: GitProviderConnectionsSectionProps) => (
  <section className="flex flex-col gap-4" aria-label={`${providerName} ${label}`}>
    <div className="flex flex-col gap-1">
      <Typography variant="h2" as="h2">
        {label}
      </Typography>
      <Typography variant="body-muted" as="p">
        connect {providerName} once for the whole instance, then link projects to its repositories.
      </Typography>
    </div>
    {status.status === "ok" ? <ConnectionsCard status={status} /> : null}
    {status.status === "error" ? <ConnectionsErrorCard label={label} error={status.error} /> : null}
    {status.status === "not_configured" ? (
      <ConnectionsNotConfiguredCard label={label} setupGuideUrl={setupGuideUrl} />
    ) : null}
  </section>
);
