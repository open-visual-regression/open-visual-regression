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
};

const humanize = (segment: string) => segment.replace(/-/g, " ");

const getBreadcrumbSegments = async (pathname: string): Promise<BreadcrumbSegment[]> => {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "projects" }];
  }

  const labels = await Promise.all(
    segments.map(async (segment, index) => {
      const pattern = [...segments.slice(0, index), "*"].join("/");
      const resolved = await SEGMENT_RESOLVERS[pattern]?.(segment);
      return resolved ?? humanize(segment);
    }),
  );

  return labels.map((label, index) => ({
    label,
    href: index === labels.length - 1 ? undefined : `/${segments.slice(0, index + 1).join("/")}`,
  }));
};

export { getBreadcrumbSegments };
export type { BreadcrumbSegment };
