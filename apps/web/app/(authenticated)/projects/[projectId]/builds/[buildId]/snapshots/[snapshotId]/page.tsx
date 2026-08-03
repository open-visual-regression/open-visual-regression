import { notFound } from "next/navigation";

import { canReview } from "@/lib/auth/roles";
import { getCachedSession } from "@/lib/auth/session";
import { serverClient } from "@/lib/router";
import { serverError } from "@/lib/utils/errors";
import { getStorybookStoryPath, hasHostedStorybook } from "@/lib/utils/storage";

import { ComparisonControls } from "./_components/snapshot-comparison-section/comparison-view/ComparisonControls";
import { SnapshotComparisonSection } from "./_components/snapshot-comparison-section/SnapshotComparisonSection";
import { SnapshotHeader } from "./_components/snapshot-header/SnapshotHeader";
import { SnapshotLayout } from "./_components/snapshot-layout/SnapshotLayout";
import { SnapshotSidebarContent } from "./_components/snapshot-sidebar/SnapshotSidebarContent";

type SnapshotPageProps = PageProps<"/projects/[projectId]/builds/[buildId]/snapshots/[snapshotId]">;

export default async function SnapshotPage(props: SnapshotPageProps) {
  const { projectId, buildId, snapshotId } = await props.params;

  const [
    session,
    [buildError, buildResult],
    [snapshotError, snapshotResult],
    [diffError, diffResult],
    [adjacentError, adjacentResult],
    [reviewsError, reviewsResult],
  ] = await Promise.all([
    getCachedSession(),
    serverClient.builds.getOne({ buildId }),
    serverClient.snapshots.getOne({ snapshotId }),
    serverClient.diffs.getOne({ snapshotId }),
    serverClient.snapshots.getAdjacent({ snapshotId }),
    serverClient.diffs.listReviews({ snapshotId }),
  ]);

  if (
    buildError?.code === "NOT_FOUND" ||
    snapshotError?.code === "NOT_FOUND" ||
    diffError?.code === "NOT_FOUND" ||
    adjacentError?.code === "NOT_FOUND" ||
    reviewsError?.code === "NOT_FOUND"
  ) {
    notFound();
  }

  if (buildError || snapshotError || diffError || adjacentError || reviewsError) {
    serverError(buildError || snapshotError || diffError || adjacentError || reviewsError);
  }

  const { build } = buildResult;
  const { snapshot } = snapshotResult;
  const { diff } = diffResult;
  const { prevSnapshotId, nextSnapshotId, position, total } = adjacentResult;

  const storybookHref = hasHostedStorybook(build)
    ? getStorybookStoryPath(build.id, snapshot.targetId)
    : null;

  return (
    <SnapshotLayout
      snapshot={snapshot}
      diff={diff}
      projectId={projectId}
      buildId={buildId}
      prevSnapshotId={prevSnapshotId}
      nextSnapshotId={nextSnapshotId}
      position={position}
      total={total}
      canReview={canReview(session?.user.role)}
      sidebar={
        <SnapshotSidebarContent
          snapshot={snapshot}
          diffId={diff?.id ?? null}
          reviews={reviewsResult}
        />
      }
    >
      <SnapshotHeader
        snapshot={snapshot}
        build={build}
        storybookHref={storybookHref}
        controls={
          diff?.baselineSnapshot ? (
            <ComparisonControls hasDiff={diff.diffImagePath !== null} />
          ) : null
        }
      />
      <SnapshotComparisonSection snapshot={snapshot} diff={diff} />
    </SnapshotLayout>
  );
}
