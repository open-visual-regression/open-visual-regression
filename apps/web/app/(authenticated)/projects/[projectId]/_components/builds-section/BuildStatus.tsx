import { type ComponentProps } from "react";
import { Badge } from "@ovr/ui/components/badge";
import { StatusIcon } from "@ovr/ui/components/status-icon";
import { TableRow } from "@ovr/ui/components/table";
import { cn } from "@ovr/ui/lib/utils";
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

type BuildStatusTableRowProps = ComponentProps<typeof TableRow> & { status: BuildStatus };

export const BuildStatusTableRow = ({ status, className, ...props }: BuildStatusTableRowProps) => {
  switch (status) {
    case "pending":
      return (
        <TableRow className={cn("border-l-4 border-l-ovr-status-pending", className)} {...props} />
      );
    case "needs_review":
      return <TableRow className={cn("border-l-4 border-l-ovr-accent", className)} {...props} />;
    case "passed":
      return <TableRow className={cn("border-l-4 border-l-ovr-diff-add", className)} {...props} />;
    case "error":
      return <TableRow className={cn("border-l-4 border-l-ovr-remove", className)} {...props} />;
  }
};
