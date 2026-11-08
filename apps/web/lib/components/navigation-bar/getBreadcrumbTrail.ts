import { type QueryClient } from "@tanstack/react-query";

import { type orpc } from "@/lib/orpc/client";

type BreadcrumbResource = "project" | "build" | "snapshot";

type BreadcrumbTrailItem = {
  segment: string;
  label: string;
  href?: string;
  resource?: BreadcrumbResource;
};

type BreadcrumbQueryUtils = Pick<typeof orpc, "projects" | "builds" | "snapshots">;

const SEGMENT_RESOURCES: Record<string, BreadcrumbResource> = {
  "projects/*": "project",
  "projects/*/builds/*": "build",
  "projects/*/builds/*/snapshots/*": "snapshot",
};

const SEGMENT_FILTERS = new Set<string>(["projects/*/builds", "projects/*/builds/*/snapshots"]);

const LITERAL_SEGMENTS = new Set(["projects", "builds", "snapshots", "new"]);

const humanize = (segment: string) => segment.replace(/-/g, " ");

const toPathSegments = (path: string): string[] =>
  new URL(path, "http://localhost").pathname.split("/").filter(Boolean).map(decodeURIComponent);

const getBreadcrumbTrail = (segments: string[]): BreadcrumbTrailItem[] => {
  if (segments.length === 0) {
    return [{ segment: "", label: "overview" }];
  }

  const entries = segments
    .map((segment, index) => {
      const pattern = segments
        .slice(0, index + 1)
        .map((value) => (LITERAL_SEGMENTS.has(value) ? value : "*"))
        .join("/");

      return SEGMENT_FILTERS.has(pattern)
        ? null
        : { index, segment, resource: SEGMENT_RESOURCES[pattern] };
    })
    .filter((entry) => entry !== null);

  return entries.map(({ index, segment, resource }, position) => ({
    segment,
    label: resource ? segment : humanize(segment),
    href:
      position === entries.length - 1 ? undefined : `/${segments.slice(0, index + 1).join("/")}`,
    resource,
  }));
};

const BREADCRUMB_QUERIES = {
  project: (utils: BreadcrumbQueryUtils, projectId: string) => ({
    ...utils.projects.getOne.queryOptions({ input: { projectId } }),
    select: (result: { project: { name: string } }) => result.project.name,
    retry: false,
  }),
  build: (utils: BreadcrumbQueryUtils, buildId: string) => ({
    ...utils.builds.getOne.queryOptions({ input: { buildId } }),
    select: (result: { build: { id: string; name: string | null } }) =>
      result.build.name ?? result.build.id,
    retry: false,
  }),
  snapshot: (utils: BreadcrumbQueryUtils, snapshotId: string) => ({
    ...utils.snapshots.getOne.queryOptions({ input: { snapshotId } }),
    select: (result: { snapshot: { targetTitle: string; targetName: string } }) =>
      `${result.snapshot.targetTitle} ${result.snapshot.targetName}`,
    retry: false,
  }),
};

const getBreadcrumbQueryOptions = (
  utils: BreadcrumbQueryUtils,
  segment: string,
  resource: BreadcrumbResource,
) => BREADCRUMB_QUERIES[resource](utils, segment);

const prefetchBreadcrumbQuery = (
  queryClient: QueryClient,
  utils: BreadcrumbQueryUtils,
  segment: string,
  resource: BreadcrumbResource,
) => {
  switch (resource) {
    case "project":
      return queryClient.prefetchQuery(BREADCRUMB_QUERIES.project(utils, segment));
    case "build":
      return queryClient.prefetchQuery(BREADCRUMB_QUERIES.build(utils, segment));
    case "snapshot":
      return queryClient.prefetchQuery(BREADCRUMB_QUERIES.snapshot(utils, segment));
  }
};

export { getBreadcrumbQueryOptions, getBreadcrumbTrail, prefetchBreadcrumbQuery, toPathSegments };
export type { BreadcrumbQueryUtils, BreadcrumbResource, BreadcrumbTrailItem };
