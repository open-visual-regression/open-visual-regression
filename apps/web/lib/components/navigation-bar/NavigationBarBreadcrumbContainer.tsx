"use client";

import { useQueries } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { orpc } from "@/lib/orpc/client";

import {
  getBreadcrumbQueryOptions,
  getBreadcrumbTrail,
  toPathSegments,
} from "./getBreadcrumbTrail";
import { NavigationBarBreadcrumb } from "./NavigationBarBreadcrumb";

const NavigationBarBreadcrumbContainer = () => {
  const trail = getBreadcrumbTrail(toPathSegments(usePathname()));
  const resolvable = trail.flatMap(({ segment, resource }) =>
    resource ? [{ segment, resource }] : [],
  );

  const results = useQueries({
    queries: resolvable.map(({ segment, resource }) =>
      getBreadcrumbQueryOptions(orpc, segment, resource),
    ),
  });

  const resultsBySegment = new Map(
    resolvable.map(({ segment }, index) => [segment, results[index]]),
  );

  const segments = trail.map(({ segment, label, href }) => {
    const result = resultsBySegment.get(segment);

    return { label: result?.data ?? label, href, isPending: result?.isPending ?? false };
  });

  return <NavigationBarBreadcrumb segments={segments} />;
};

export { NavigationBarBreadcrumbContainer };
