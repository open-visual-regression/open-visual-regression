import Link from "next/link";
import { ComponentProps } from "react";

import { Button } from "@ovr/ui/components/button";

type ButtonLinkProps = Omit<ComponentProps<typeof Button>, "render" | "nativeButton"> & {
  href: string | null;
  target?: string;
  rel?: string;
};

export const ButtonLink = ({
  children,
  href,
  disabled,
  target,
  rel,
  ...props
}: ButtonLinkProps) => {
  const isDisabled = disabled || !href;

  return isDisabled ? (
    <Button {...props} disabled>
      {children}
    </Button>
  ) : (
    <Button {...props} render={<Link href={href} target={target} rel={rel} />} nativeButton={false}>
      {children}
    </Button>
  );
};
