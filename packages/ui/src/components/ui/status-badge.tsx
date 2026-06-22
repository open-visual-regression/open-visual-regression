import { Badge, type BadgeVariant } from "./badge";
import { StatusIcon, type StatusVariant } from "./status-icon";

type StatusBadgeProps = {
  variant: BadgeVariant;
  icon: StatusVariant;
  filled?: boolean;
  children: React.ReactNode;
};

const StatusBadge = ({ variant, icon, filled, children }: StatusBadgeProps) => (
  <Badge variant={variant} filled={filled}>
    <StatusIcon variant={icon} size={12} className={filled ? "text-current" : undefined} />
    {children}
  </Badge>
);

export { StatusBadge };
export type { StatusBadgeProps };
