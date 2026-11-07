import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ovr/ui/components/breadcrumb";
import { Skeleton } from "@ovr/ui/components/skeleton";

type BreadcrumbSegment = {
  label: string;
  href?: string;
  isPending?: boolean;
};

type NavigationBarBreadcrumbProps = {
  segments: BreadcrumbSegment[];
};

const NavigationBarBreadcrumbLabel = ({ label, href, isPending }: BreadcrumbSegment) => {
  if (isPending) {
    return <Skeleton className="h-3 w-24" />;
  }

  return href ? (
    <BreadcrumbLink render={<Link href={href} />} className="block max-w-75 truncate">
      {label}
    </BreadcrumbLink>
  ) : (
    <BreadcrumbPage className="block max-w-75 truncate">{label}</BreadcrumbPage>
  );
};

const NavigationBarBreadcrumb = ({ segments }: NavigationBarBreadcrumbProps) => (
  <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
    <BreadcrumbList className="flex-nowrap">
      {segments.map((segment, index) => (
        <Fragment key={`${segment.label}-${index}`}>
          {index > 0 ? <BreadcrumbSeparator className="shrink-0" /> : null}
          <BreadcrumbItem className="min-w-0">
            <NavigationBarBreadcrumbLabel {...segment} />
          </BreadcrumbItem>
        </Fragment>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
);

export { NavigationBarBreadcrumb };
export type { BreadcrumbSegment, NavigationBarBreadcrumbProps };
