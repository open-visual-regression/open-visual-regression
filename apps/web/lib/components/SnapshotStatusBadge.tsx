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
        <Badge variant="pending">
          <StatusIcon variant="pending" size={12} /> pending
        </Badge>
      );
    case "changed":
      return (
        <Badge variant="changed">
          <StatusIcon variant="changed" size={12} /> needs review
        </Badge>
      );
    case "pass":
      return (
        <Badge variant="pass">
          <StatusIcon variant="passed" size={12} /> passed
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected">
          <StatusIcon variant="rejected" size={12} /> rejected
        </Badge>
      );
    case "fail":
      return (
        <Badge variant="fail">
          <StatusIcon variant="error" size={12} /> error
        </Badge>
      );
  }
};
