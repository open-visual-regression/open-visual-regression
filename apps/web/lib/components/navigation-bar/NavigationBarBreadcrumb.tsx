import { Fragment } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ovr/ui/components/breadcrumb";
import type { BreadcrumbSegment } from "./getBreadcrumbSegments";

type NavigationBarBreadcrumbProps = {
  segments: BreadcrumbSegment[];
};

const NavigationBarBreadcrumb = ({ segments }: NavigationBarBreadcrumbProps) => (
  <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
    <BreadcrumbList className="flex-nowrap">
      {segments.map((segment, index) => (
        <Fragment key={`${segment.label}-${index}`}>
          {index > 0 ? <BreadcrumbSeparator className="shrink-0" /> : null}
          <BreadcrumbItem className="min-w-0">
            {segment.href ? (
              <BreadcrumbLink
                render={<Link href={segment.href} />}
                className="block max-w-75 truncate"
              >
                {segment.label}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className="block max-w-75 truncate">{segment.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </Fragment>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
);

export { NavigationBarBreadcrumb };
export type { NavigationBarBreadcrumbProps };
