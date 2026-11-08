import Link from "next/link";
import { type ReactNode } from "react";

import { Icon, type IconProps } from "@ovr/ui/components/icon";
import { cn } from "@ovr/ui/lib/utils";

const pillClassName =
  "inline-flex min-w-0 items-center gap-1 rounded-md border border-ovr-border-subtle bg-ovr-elevated px-1.5 py-0.5 font-mono text-xs";

const linkClassName = "hover:border-ovr-border hover:text-ovr-fg focus-visible:outline-2";

export type GitPillProps = {
  icon: IconProps["icon"];
  href: string | null;
  external?: boolean;
  className?: string;
  children: ReactNode;
};

// A git ref (a branch or a commit) shown as a pill, linking to it when there is somewhere to go.
export const GitPill = ({ icon, href, external = false, className, children }: GitPillProps) => {
  const content = (
    <>
      <Icon icon={icon} size={10} className="shrink-0" />
      {children}
    </>
  );

  if (!href) {
    return <span className={cn(pillClassName, className)}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className={cn(pillClassName, linkClassName, className)}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {content}
    </Link>
  );
};
