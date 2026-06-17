import { Badge } from "@ovr/ui/components/badge";
import { StatusIcon } from "@ovr/ui/components/status-icon";
import { type BuildStatus } from "@ovr/api/contracts/builds";

export const BuildStatusIcon = ({ status }: { status: BuildStatus }) => {
  switch (status) {
    case "pending":
      return <StatusIcon variant="pending" />;
    case "needs_review":
      return <StatusIcon variant="changed" />;
    case "passed":
      return <StatusIcon variant="passed" />;
    case "error":
      return <StatusIcon variant="rejected" />;
  }
};

export const BuildStatusBadge = ({ status }: { status: BuildStatus }) => {
  switch (status) {
    case "pending":
      return <Badge variant="pending">pending</Badge>;
    case "needs_review":
      return <Badge variant="changed">needs review</Badge>;
    case "passed":
      return <Badge variant="pass">passed</Badge>;
    case "error":
      return <Badge variant="fail">error</Badge>;
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
