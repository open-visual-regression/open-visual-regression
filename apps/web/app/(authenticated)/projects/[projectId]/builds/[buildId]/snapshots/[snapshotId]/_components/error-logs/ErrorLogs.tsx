import { Typography } from "@ovr/ui/components/typography";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";

export type ErrorLogsProps = {
  logs: SnapshotSchema["errorLogs"];
};

export const ErrorLogs = ({ logs }: ErrorLogsProps) => {
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-card border border-ovr-border bg-ovr-elevated p-4">
      <Typography variant="label">error logs</Typography>
      <div className="flex flex-col gap-1">
        {logs.map((log) => (
          <Typography key={log.id} variant="code" className="text-xs text-ovr-fg-secondary">
            [{log.level}] {log.message}
          </Typography>
        ))}
      </div>
    </div>
  );
};
