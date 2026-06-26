import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-badge font-semibold tracking-label uppercase whitespace-nowrap",
  {
    variants: {
      variant: {
        solid: "border-transparent",
        outline: "bg-transparent",
      },
      color: {
        accent: "",
        red: "",
        green: "",
        blue: "",
        amber: "",
        gray: "",
        purple: "",
        neutral: "",
      },
    },
    compoundVariants: [
      { variant: "outline", color: "accent", className: "border-ovr-accent text-ovr-accent" },
      { variant: "outline", color: "red", className: "border-ovr-red text-ovr-red" },
      { variant: "outline", color: "green", className: "border-ovr-green text-ovr-green" },
      { variant: "outline", color: "blue", className: "border-ovr-blue text-ovr-blue" },
      { variant: "outline", color: "amber", className: "border-ovr-amber text-ovr-amber" },
      { variant: "outline", color: "gray", className: "border-ovr-gray text-ovr-gray" },
      { variant: "outline", color: "purple", className: "border-ovr-purple text-ovr-purple" },
      {
        variant: "outline",
        color: "neutral",
        className: "border-ovr-fg-secondary text-ovr-fg-secondary",
      },
      { variant: "solid", color: "accent", className: "bg-ovr-accent text-ovr-on-accent" },
      { variant: "solid", color: "red", className: "bg-ovr-red text-ovr-on-solid" },
      { variant: "solid", color: "green", className: "bg-ovr-green text-ovr-on-solid" },
      { variant: "solid", color: "blue", className: "bg-ovr-blue text-ovr-on-solid" },
      { variant: "solid", color: "amber", className: "bg-ovr-amber text-ovr-on-solid" },
      { variant: "solid", color: "gray", className: "bg-ovr-gray text-ovr-on-solid" },
      { variant: "solid", color: "purple", className: "bg-ovr-purple text-ovr-on-solid" },
      {
        variant: "solid",
        color: "neutral",
        className: "bg-ovr-fg-secondary text-ovr-on-solid",
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "neutral",
    },
  },
);

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: React.ReactNode;
  className?: string;
};

const Badge = ({ variant, color, children, className }: BadgeProps) => {
  return <span className={cn(badgeVariants({ variant, color }), className)}>{children}</span>;
};

export { Badge, badgeVariants };
export type { BadgeProps };
