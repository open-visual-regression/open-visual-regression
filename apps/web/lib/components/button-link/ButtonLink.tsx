import { Button } from "@ovr/ui/components/button";
import Link from "next/link";
import { ComponentProps } from "react";

type ButtonLinkProps = Omit<ComponentProps<typeof Button>, "render" | "nativeButton"> & {
  href: string;
};

export const ButtonLink = ({ children, href, ...props }: ButtonLinkProps) => (
  <Button {...props} render={<Link href={href} />} nativeButton={false}>
    {children}
  </Button>
);
