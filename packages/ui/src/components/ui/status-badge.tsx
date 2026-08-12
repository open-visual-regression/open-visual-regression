import { Badge, type BadgeProps } from "./badge";
import { StatusIcon, type StatusVariant } from "./status-icon";

type StatusBadgeProps = Pick<BadgeProps, "variant" | "color" | "size"> & {
  icon: StatusVariant;
  children: React.ReactNode;
};

const ICON_SIZE: Record<NonNullable<BadgeProps["size"]>, number> = {
  md: 12,
  sm: 10,
};

const StatusBadge = ({ variant, color, size, icon, children }: StatusBadgeProps) => {
  const resolvedSize = size ?? "md";
  return (
    <Badge variant={variant} color={color} size={resolvedSize}>
      <StatusIcon
        variant={icon}
        size={ICON_SIZE[resolvedSize]}
        className={variant === "solid" ? "text-current" : undefined}
      />
      {children}
    </Badge>
  );
};

export { StatusBadge };
export type { StatusBadgeProps };
