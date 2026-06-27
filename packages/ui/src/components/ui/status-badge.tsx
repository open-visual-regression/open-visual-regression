import { Badge, type BadgeProps } from "./badge";
import { StatusIcon, type StatusVariant } from "./status-icon";

type StatusBadgeProps = Pick<BadgeProps, "variant" | "color"> & {
  icon: StatusVariant;
  children: React.ReactNode;
};

const StatusBadge = ({ variant, color, icon, children }: StatusBadgeProps) => (
  <Badge variant={variant} color={color}>
    <StatusIcon
      variant={icon}
      size={12}
      className={variant === "solid" ? "text-current" : undefined}
    />
    {children}
  </Badge>
);

export { StatusBadge };
export type { StatusBadgeProps };
