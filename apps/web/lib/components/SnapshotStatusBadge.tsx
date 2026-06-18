import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { Badge } from "@ovr/ui/components/badge";
import { StatusIcon } from "@ovr/ui/components/status-icon";

type SnapshotStatusBadgeProps = {
  status: SnapshotDisplayStatus;
};

export const SnapshotStatusBadge = ({ status }: SnapshotStatusBadgeProps) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="pending" filled>
          <StatusIcon variant="pending" size={12} className="text-current" /> pending
        </Badge>
      );
    case "changed":
      return (
        <Badge variant="changed" filled>
          <StatusIcon variant="changed" size={12} className="text-current" /> needs review
        </Badge>
      );
    case "pass":
      return (
        <Badge variant="pass" filled>
          <StatusIcon variant="passed" size={12} className="text-current" /> passed
        </Badge>
      );
    case "fail":
      return (
        <Badge variant="fail" filled>
          <StatusIcon variant="rejected" size={12} className="text-current" /> error
        </Badge>
      );
  }
};
