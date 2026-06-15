import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";
import { CopyButton } from "../copy-button/CopyButton";

type CodeBlockProps = {
  code: string;
  truncate?: boolean;
  className?: string;
};

export const CodeBlock = ({ code, truncate = false, className }: CodeBlockProps) => (
  <div
    className={cn(
      "flex min-w-0 gap-2 rounded-md border border-ovr-border-subtle bg-ovr-inset px-3 py-2",
      truncate ? "items-center" : "items-start",
      className,
    )}
  >
    <Typography
      as={truncate ? "code" : "pre"}
      variant="code"
      className={cn("min-w-0 flex-1", truncate ? "truncate" : "overflow-x-auto")}
    >
      {code}
    </Typography>
    <CopyButton text={code} />
  </div>
);
