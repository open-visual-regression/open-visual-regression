import Link from "next/link";

import { cn } from "@ovr/ui/lib/utils";

type SidebarCollapsedLinkProps = {
  href: string;
  title: string;
  active?: boolean;
  children?: React.ReactNode;
};

const SidebarCollapsedLink = ({ href, title, active, children }: SidebarCollapsedLinkProps) => (
  <Link
    href={href}
    title={title}
    aria-current={active ? "page" : undefined}
    className={cn(
      "flex h-8 items-center justify-center border-l-2 no-underline transition-colors relative",
      active ? "bg-ovr-active border-l-ovr-accent" : "border-l-transparent hover:bg-ovr-hover",
    )}
  >
    {children}
  </Link>
);

export { SidebarCollapsedLink };
export type { SidebarCollapsedLinkProps };
