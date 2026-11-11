import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { MultiLineCodeBlock } from "@/lib/components/multi-line-code-block/MultiLineCodeBlock";
import { MultiLineCodeBlockBody } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockBody";
import { MultiLineCodeBlockCopyButton } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockCopyButton";
import { MultiLineCodeBlockHeader } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockHeader";
import { MultiLineCodeBlockLabel } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockLabel";
import { MultiLineCodeBlockLine } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockLine";
import { MultiLineCodeBlockLineCount } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockLineCount";

export type SnapshotLogsProps = {
  logs: SnapshotSchema["errorLogs"];
};

export const SnapshotLogs = ({ logs }: SnapshotLogsProps) => {
  if (logs.length === 0) {
    return <Typography variant="body-muted">no logs to show</Typography>;
  }

  const lines = logs.map((log) => `[${log.level}] ${log.message}`);

  return (
    <MultiLineCodeBlock lines={lines} wrap>
      <MultiLineCodeBlockHeader>
        <MultiLineCodeBlockLabel>logs</MultiLineCodeBlockLabel>
        <MultiLineCodeBlockLineCount />
        <MultiLineCodeBlockCopyButton />
      </MultiLineCodeBlockHeader>
      <MultiLineCodeBlockBody>
        {logs.map((log, index) => (
          <MultiLineCodeBlockLine
            key={log.id}
            lineNumber={index + 1}
            tone={log.level === "error" ? "error" : "default"}
          >
            [{log.level}] {log.message}
          </MultiLineCodeBlockLine>
        ))}
      </MultiLineCodeBlockBody>
    </MultiLineCodeBlock>
  );
};

export const SnapshotLogsSkeleton = () => (
  <MultiLineCodeBlock lines={[]} wrap>
    <MultiLineCodeBlockHeader>
      <MultiLineCodeBlockLabel>logs</MultiLineCodeBlockLabel>
      <TypographySkeleton variant="body-sm" className="ml-auto w-12 shrink-0" />
      <Skeleton className="h-6 w-16 shrink-0 rounded-lg" />
    </MultiLineCodeBlockHeader>
    <MultiLineCodeBlockBody aria-hidden>
      {["w-3/4", "w-1/2", "w-2/3"].map((width) => (
        <div key={width} className="flex items-start gap-3 px-3">
          <TypographySkeleton variant="code" className="w-5 shrink-0" />
          <TypographySkeleton variant="code" className={width} />
        </div>
      ))}
    </MultiLineCodeBlockBody>
  </MultiLineCodeBlock>
);
