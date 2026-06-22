import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { MultiLineCodeBlock } from "@/lib/components/multi-line-code-block/MultiLineCodeBlock";
import { MultiLineCodeBlockBody } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockBody";
import { MultiLineCodeBlockCopyButton } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockCopyButton";
import { MultiLineCodeBlockLabel } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockLabel";
import { MultiLineCodeBlockHeader } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockHeader";
import { MultiLineCodeBlockLine } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockLine";
import { MultiLineCodeBlockLineCount } from "@/lib/components/multi-line-code-block/MultiLineCodeBlockLineCount";

export type ErrorLogsProps = {
  logs: SnapshotSchema["errorLogs"];
};

export const ErrorLogs = ({ logs }: ErrorLogsProps) => {
  if (logs.length === 0) {
    return null;
  }

  const lines = logs.map((log) => `[${log.level}] ${log.message}`);

  return (
    <MultiLineCodeBlock lines={lines}>
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
