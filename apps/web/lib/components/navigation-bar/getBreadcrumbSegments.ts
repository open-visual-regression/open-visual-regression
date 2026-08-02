import "server-only";
import { cachedServerClient } from "@/lib/router/cached";

type BreadcrumbSegment = {
  label: string;
  href?: string;
};

type SegmentResolver = (value: string) => Promise<string | undefined>;

const SEGMENT_RESOLVERS: Record<string, SegmentResolver> = {
  "projects/*": async (projectId) => {
    const [error, result] = await cachedServerClient.projects.getOne(projectId);
    return error ? projectId : result.project.name;
  },
  "projects/*/builds/*": async (buildId) => {
    const [error, result] = await cachedServerClient.builds.getOne(buildId);
    return error ? buildId : (result.build.name ?? result.build.id);
  },
  "projects/*/builds/*/snapshots/*": async (snapshotId) => {
    const [error, result] = await cachedServerClient.snapshots.getOne(snapshotId);
    return error ? snapshotId : `${result.snapshot.targetTitle} ${result.snapshot.targetName}`;
  },
};

const SEGMENT_FILTERS = new Set<string>(["projects/*/builds", "projects/*/builds/*/snapshots"]);

const LITERAL_SEGMENTS = new Set(["projects", "builds", "snapshots"]);

const humanize = (segment: string) => segment.replace(/-/g, " ");

const getBreadcrumbSegments = async (segments: string[]): Promise<BreadcrumbSegment[]> => {
  if (segments.length === 0) {
    return [{ label: "projects" }];
  }

  const entries = await Promise.all(
    segments.map(async (segment, index) => {
      const pattern = segments
        .slice(0, index + 1)
        .map((value) => (LITERAL_SEGMENTS.has(value) ? value : "*"))
        .join("/");

      if (SEGMENT_FILTERS.has(pattern)) {
        return null;
      }

      const resolved = await SEGMENT_RESOLVERS[pattern]?.(segment);
      return { index, label: resolved ?? humanize(segment) };
    }),
  );

  const filteredEntries = entries.filter((entry) => entry !== null);

  return filteredEntries.map(({ index, label }, position) => {
    const href =
      position === filteredEntries.length - 1
        ? undefined
        : `/${segments.slice(0, index + 1).join("/")}`;

    return { label, href };
  });
};

export { getBreadcrumbSegments };
export type { BreadcrumbSegment };
