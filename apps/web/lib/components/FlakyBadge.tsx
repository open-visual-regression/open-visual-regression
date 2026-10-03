import { Badge } from "@ovr/ui/components/badge";
import { Icon, SnowflakeIcon } from "@ovr/ui/components/icon";

type FlakyBadgeProps = {
  filled?: boolean;
};

export const FlakyBadge = ({ filled }: FlakyBadgeProps) =>
  filled ? (
    <Badge variant="solid" color="purple" className="self-stretch">
      <Icon icon={SnowflakeIcon} size={12} role="img" aria-label="flaky" />
    </Badge>
  ) : (
    <Badge color="purple">
      <Icon icon={SnowflakeIcon} size={12} aria-hidden />
      flaky
    </Badge>
  );
