import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "lowercase group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ovr-accent/35 focus-visible:border-ovr-accent active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:bg-ovr-elevated disabled:text-ovr-fg-muted disabled:border-ovr-border-subtle aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        solid: "font-semibold tracking-[-0.01em]",
        outline: "bg-transparent font-medium",
        ghost: "bg-transparent font-medium",
        link: "bg-transparent underline-offset-4 hover:underline",
      },
      color: {
        accent: "",
        red: "",
        green: "",
        blue: "",
        amber: "",
        neutral: "",
      },
      size: {
        md: "h-8 gap-1 px-3.5 text-xs has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 px-2 text-badge has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-7 gap-1 px-2.5 text-label has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-10 gap-1.5 px-4.5 text-body has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-5 [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-10 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    compoundVariants: [
      // solid
      {
        variant: "solid",
        color: "accent",
        className: "bg-ovr-accent text-ovr-on-accent hover:bg-ovr-accent-hover",
      },
      {
        variant: "solid",
        color: "red",
        className: "bg-ovr-red text-ovr-on-solid hover:bg-ovr-red-hover",
      },
      {
        variant: "solid",
        color: "green",
        className: "bg-ovr-green text-ovr-on-solid hover:bg-ovr-green-hover",
      },
      {
        variant: "solid",
        color: "blue",
        className: "bg-ovr-blue text-ovr-on-solid hover:bg-ovr-blue-hover",
      },
      {
        variant: "solid",
        color: "amber",
        className: "bg-ovr-amber text-ovr-on-solid hover:bg-ovr-amber-hover",
      },
      {
        variant: "solid",
        color: "neutral",
        className: "bg-ovr-fg text-background hover:bg-ovr-fg-secondary",
      },
      // outline
      {
        variant: "outline",
        color: "accent",
        className: "border-ovr-accent text-ovr-accent hover:bg-ovr-accent-dim",
      },
      {
        variant: "outline",
        color: "red",
        className: "border-ovr-red text-ovr-red hover:bg-ovr-red-dim",
      },
      {
        variant: "outline",
        color: "green",
        className: "border-ovr-green text-ovr-green hover:bg-ovr-green-dim",
      },
      {
        variant: "outline",
        color: "blue",
        className: "border-ovr-blue text-ovr-blue hover:bg-ovr-blue-dim",
      },
      {
        variant: "outline",
        color: "amber",
        className: "border-ovr-amber text-ovr-amber hover:bg-ovr-amber-dim",
      },
      {
        variant: "outline",
        color: "neutral",
        className:
          "border-ovr-border text-ovr-fg hover:bg-ovr-elevated aria-expanded:bg-ovr-elevated",
      },
      // ghost
      {
        variant: "ghost",
        color: "accent",
        className: "text-ovr-accent hover:bg-ovr-accent-dim",
      },
      { variant: "ghost", color: "red", className: "text-ovr-red hover:bg-ovr-red-dim" },
      { variant: "ghost", color: "green", className: "text-ovr-green hover:bg-ovr-green-dim" },
      { variant: "ghost", color: "blue", className: "text-ovr-blue hover:bg-ovr-blue-dim" },
      { variant: "ghost", color: "amber", className: "text-ovr-amber hover:bg-ovr-amber-dim" },
      {
        variant: "ghost",
        color: "neutral",
        className:
          "text-ovr-fg-secondary hover:bg-ovr-hover hover:text-ovr-fg aria-expanded:bg-ovr-hover aria-expanded:text-ovr-fg",
      },
      // link
      { variant: "link", color: "accent", className: "text-ovr-accent" },
      { variant: "link", color: "red", className: "text-ovr-red" },
      { variant: "link", color: "green", className: "text-ovr-green" },
      { variant: "link", color: "blue", className: "text-ovr-blue" },
      { variant: "link", color: "amber", className: "text-ovr-amber" },
      { variant: "link", color: "neutral", className: "text-ovr-fg" },
    ],
    defaultVariants: {
      variant: "solid",
      color: "accent",
      size: "md",
    },
  },
);

const Button = ({
  className,
  variant = "solid",
  color = "accent",
  size = "md",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, color, size, className }))}
      {...props}
    />
  );
};

export { Button, buttonVariants };
