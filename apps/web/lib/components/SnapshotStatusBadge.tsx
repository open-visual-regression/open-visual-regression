import { type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { Badge } from "@ovr/ui/components/badge";
import { StatusIcon } from "@ovr/ui/components/status-icon";

type SnapshotStatusBadgeProps = {
  status: SnapshotDisplayStatus;
  filled?: boolean;
};

export const SnapshotStatusBadge = ({ status, filled }: SnapshotStatusBadgeProps) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="pending" filled={filled}>
          <StatusIcon variant="pending" size={12} className={filled ? "text-current" : undefined} />{" "}
          pending
        </Badge>
      );
    case "changed":
      return (
        <Badge variant="changed" filled={filled}>
          <StatusIcon variant="changed" size={12} className={filled ? "text-current" : undefined} />{" "}
          needs review
        </Badge>
      );
    case "pass":
      return (
        <Badge variant="pass" filled={filled}>
          <StatusIcon variant="passed" size={12} className={filled ? "text-current" : undefined} />{" "}
          passed
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="rejected" filled={filled}>
          <StatusIcon
            variant="rejected"
            size={12}
            className={filled ? "text-current" : undefined}
          />{" "}
          rejected
        </Badge>
      );
    case "fail":
      return (
        <Badge variant="fail" filled={filled}>
          <StatusIcon variant="error" size={12} className={filled ? "text-current" : undefined} />{" "}
          error
        </Badge>
      );
  }
};
