import { Badge } from "@ovr/ui/components/badge";
import { StatusIcon } from "@ovr/ui/components/status-icon";
import { type BuildStatus } from "@ovr/api/contracts/builds";

export const BuildStatusBadge = ({ status }: { status: BuildStatus }) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="pending">
          <StatusIcon variant="pending" size={12} /> pending
        </Badge>
      );
    case "needs_review":
      return (
        <Badge variant="changed">
          <StatusIcon variant="changed" size={12} /> needs review
        </Badge>
      );
    case "passed":
      return (
        <Badge variant="pass">
          <StatusIcon variant="passed" size={12} /> passed
        </Badge>
      );
    case "error":
      return (
        <Badge variant="fail">
          <StatusIcon variant="rejected" size={12} /> error
        </Badge>
      );
  }
};

export const BuildStatusStripe = ({ status }: { status: BuildStatus }) => {
  switch (status) {
    case "pending":
      return <div className="absolute inset-0 bg-ovr-status-pending" />;
    case "needs_review":
      return <div className="absolute inset-0 bg-ovr-accent" />;
    case "passed":
      return <div className="absolute inset-0 bg-ovr-diff-add" />;
    case "error":
      return <div className="absolute inset-0 bg-ovr-remove" />;
  }
};
