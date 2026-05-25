import type { LucideIcon } from "lucide-react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  icon: LucideIcon;
  size?: number;
};

function Icon({ icon: LucideIconComponent, size = 16, ...props }: IconProps) {
  return (
    <LucideIconComponent
      width={size}
      height={size}
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      {...props}
    />
  );
}

export { Icon };
export type { IconProps };
