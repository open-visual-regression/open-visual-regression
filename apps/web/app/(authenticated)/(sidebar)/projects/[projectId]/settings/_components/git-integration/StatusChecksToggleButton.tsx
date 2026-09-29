import { DisableStatusChecksButton } from "./DisableStatusChecksButton";
import { EnableStatusChecksButton } from "./EnableStatusChecksButton";

type StatusChecksToggleButtonProps = {
  projectId: string;
  enabled: boolean;
  className?: string;
};

export const StatusChecksToggleButton = ({
  projectId,
  enabled,
  className,
}: StatusChecksToggleButtonProps) =>
  enabled ? (
    <DisableStatusChecksButton projectId={projectId} className={className} />
  ) : (
    <EnableStatusChecksButton projectId={projectId} className={className} />
  );
