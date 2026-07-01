import Link from "next/link";
import { ComponentProps } from "react";

import { Button } from "@ovr/ui/components/button";

type ButtonLinkProps = Omit<ComponentProps<typeof Button>, "render" | "nativeButton"> & {
  href: string | null;
};

export const ButtonLink = ({ children, href, disabled, ...props }: ButtonLinkProps) => {
  const isDisabled = disabled || !href;

  return isDisabled ? (
    <Button {...props} disabled>
      {children}
    </Button>
  ) : (
    <Button {...props} render={<Link href={href} />} nativeButton={false}>
      {children}
    </Button>
  );
};
