import { ComponentProps } from "react";

import { Icon, ExternalLinkIcon } from "@ovr/ui/components/icon";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

type ExternalLinkProps = Omit<
  ComponentProps<typeof ButtonLink>,
  "href" | "target" | "rel" | "variant" | "color"
> & {
  href: string;
};

export const ExternalLink = ({ children, ...props }: ExternalLinkProps) => (
  <ButtonLink {...props} variant="link" color="neutral" target="_blank" rel="noopener noreferrer">
    {children}
    <Icon icon={ExternalLinkIcon} size={10} />
  </ButtonLink>
);
