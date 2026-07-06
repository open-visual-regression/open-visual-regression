import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";

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
