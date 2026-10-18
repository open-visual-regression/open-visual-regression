import { Badge } from "@ovr/ui/components/badge";
import { Icon, TriangleAlertIcon } from "@ovr/ui/components/icon";

export const WarningBadge = () => (
  <Badge variant="solid" color="amber" className="self-stretch">
    <Icon icon={TriangleAlertIcon} size={12} role="img" aria-label="warning" />
  </Badge>
);
