"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ovr/ui/components/breadcrumb";

type NavigationBarBreadcrumbProject = {
  id: string;
  name: string;
};

type NavigationBarBreadcrumbProps = {
  projects: NavigationBarBreadcrumbProject[];
};

type BreadcrumbSegment = {
  label: string;
  href?: string;
};

const SETTINGS_LABELS: Record<string, string> = {
  profile: "profile",
  general: "general",
  users: "users",
  invitations: "invitations",
};

const getBreadcrumbSegments = (
  pathname: string,
  projects: NavigationBarBreadcrumbProject[],
): BreadcrumbSegment[] => {
  const [root, second, third] = pathname.split("/").filter(Boolean);

  if (root === "projects") {
    if (!second) {
      return [{ label: "projects" }];
    }

    if (second === "new") {
      return [{ label: "projects", href: "/projects" }, { label: "new project" }];
    }

    const project = projects.find((p) => p.id === second);
    const projectLabel = project?.name ?? second;

    if (third === "settings") {
      return [
        { label: "projects", href: "/projects" },
        { label: projectLabel, href: `/projects/${second}` },
        { label: "settings" },
      ];
    }

    return [{ label: "projects", href: "/projects" }, { label: projectLabel }];
  }

  if (root === "settings") {
    return [
      { label: "settings", href: "/settings" },
      { label: SETTINGS_LABELS[second ?? ""] ?? second ?? "" },
    ];
  }

  return [{ label: "projects", href: "/projects" }];
};

const NavigationBarBreadcrumb = ({ projects }: NavigationBarBreadcrumbProps) => {
  const pathname = usePathname();
  const segments = getBreadcrumbSegments(pathname, projects);

  return (
    <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
      <BreadcrumbList className="flex-nowrap">
        {segments.map((segment, index) => (
          <Fragment key={`${segment.label}-${index}`}>
            {index > 0 ? <BreadcrumbSeparator className="shrink-0" /> : null}
            <BreadcrumbItem className="min-w-0">
              {segment.href ? (
                <BreadcrumbLink render={<Link href={segment.href} />} className="truncate">
                  {segment.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">{segment.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export { NavigationBarBreadcrumb };
export type { NavigationBarBreadcrumbProps, NavigationBarBreadcrumbProject };
