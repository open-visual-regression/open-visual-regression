"server only";

import { serverClient } from "@/lib/router";

type BreadcrumbSegment = {
  label: string;
  href?: string;
};

type SegmentResolver = (value: string) => Promise<string | undefined>;

const SEGMENT_RESOLVERS: Record<string, SegmentResolver> = {
  "projects/*": async (projectId) => {
    const [error, result] = await serverClient.projects.getOne({ projectId });
    return error ? undefined : result.project.name;
  },
  "projects/*/builds/*": async (buildId) => {
    const [error, result] = await serverClient.builds.getOne({ buildId });
    return error ? undefined : (result.build.name ?? result.build.id);
  },
};

const SEGMENT_FILTERS = new Set<string>(["projects/*/builds"]);

const LITERAL_SEGMENTS = new Set(["projects", "builds"]);

const humanize = (segment: string) => segment.replace(/-/g, " ");

const getBreadcrumbSegments = async (segments: string[]): Promise<BreadcrumbSegment[]> => {
  if (segments.length === 0) {
    return [{ label: "projects" }];
  }

  const labels = await Promise.all(
    segments.map(async (segment, index) => {
      const pattern = segments
        .slice(0, index + 1)
        .map((value) => (LITERAL_SEGMENTS.has(value) ? value : "*"))
        .join("/");

      if (SEGMENT_FILTERS.has(pattern)) {
        return null;
      }

      const resolved = await SEGMENT_RESOLVERS[pattern]?.(segment);
      return resolved ?? humanize(segment);
    }),
  );

  const filteredLabels = labels.filter((label) => label !== null);

  return filteredLabels.map((label, index) => {
    const href =
      index === filteredLabels.length - 1
        ? undefined
        : `/${segments.slice(0, index + 1).join("/")}`;

    return { label, href };
  });
};

export { getBreadcrumbSegments };
export type { BreadcrumbSegment };
