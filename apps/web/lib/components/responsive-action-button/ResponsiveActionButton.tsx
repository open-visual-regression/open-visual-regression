import { ComponentProps } from "react";

import { Button } from "@ovr/ui/components/button";
import { Icon, type LucideIcon } from "@ovr/ui/components/icon";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { cn } from "@ovr/ui/lib/utils";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

type ResponsiveActionButtonProps = Omit<ComponentProps<typeof ButtonLink>, "href"> & {
  icon: LucideIcon;
  iconPosition?: "start" | "end";
  href?: string | null;
};

export const ResponsiveActionButton = ({
  icon,
  iconPosition = "start",
  children,
  className,
  href,
  variant = "outline",
  color = "neutral",
  size = "sm",
  ...props
}: ResponsiveActionButtonProps) => {
  const content = (
    <>
      {iconPosition === "start" ? <Icon icon={icon} /> : null}
      <span className="sr-only lg:not-sr-only">{children}</span>
      {iconPosition === "end" ? <Icon icon={icon} /> : null}
    </>
  );

  const responsiveClassName = cn("w-7 gap-0 px-0 lg:w-auto lg:gap-1 lg:px-2.5", className);

  return href !== undefined ? (
    <ButtonLink
      href={href}
      variant={variant}
      color={color}
      size={size}
      className={responsiveClassName}
      {...props}
    >
      {content}
    </ButtonLink>
  ) : (
    <Button variant={variant} color={color} size={size} className={responsiveClassName} {...props}>
      {content}
    </Button>
  );
};

export const ResponsiveActionButtonSkeleton = ({ className }: { className?: string }) => (
  <Skeleton className={cn("h-7 w-7 shrink-0 rounded-md", className)} />
);
