import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { Badge } from "@ovr/ui/components/badge";
import { Icon, TriangleAlertIcon } from "@ovr/ui/components/icon";

import { FlakyBadge } from "@/lib/components/FlakyBadge";
import { SnapshotStatusBadge } from "@/lib/components/SnapshotStatusBadge";

type SnapshotBadgesProps = {
  status: SnapshotDisplayStatus;
  warning?: boolean;
  flaky?: boolean;
};

export const SnapshotBadges = ({ status, warning, flaky }: SnapshotBadgesProps) => (
  <div className="inline-flex gap-1">
    {warning ? (
      <Badge variant="solid" color="amber" className="self-stretch">
        <Icon icon={TriangleAlertIcon} size={12} role="img" aria-label="warning" />
      </Badge>
    ) : null}
    {flaky ? <FlakyBadge filled /> : null}
    <SnapshotStatusBadge status={status} filled />
  </div>
);
