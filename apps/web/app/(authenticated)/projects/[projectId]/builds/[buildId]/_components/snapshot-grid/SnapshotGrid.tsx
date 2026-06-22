import { type BuildSnapshotSchema } from "@ovr/api/contracts/snapshots";
import { Typography } from "@ovr/ui/components/typography";
import { Button } from "@ovr/ui/components/button";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";
import { SnapshotCard } from "./SnapshotCard";

type SnapshotGridProps = {
  snapshots: BuildSnapshotSchema[];
  projectId: string;
  buildId: string;
  total: number;
  page: number;
  pageSize: number;
};

export const SnapshotGrid = ({
  snapshots,
  projectId,
  buildId,
  total,
  page,
  pageSize,
}: SnapshotGridProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const buildUrl = `/projects/${projectId}/builds/${buildId}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {snapshots.map((snapshot) => (
          <SnapshotCard
            key={snapshot.id}
            snapshot={snapshot}
            projectId={projectId}
            buildId={buildId}
          />
        ))}
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4">
          {page > 1 ? (
            <ButtonLink href={`${buildUrl}?page=${page - 1}`} variant="secondary">
              previous
            </ButtonLink>
          ) : (
            <Button variant="secondary" disabled>
              previous
            </Button>
          )}
          <Typography variant="caption">
            page {page} of {totalPages}
          </Typography>
          {page < totalPages ? (
            <ButtonLink href={`${buildUrl}?page=${page + 1}`} variant="secondary">
              next
            </ButtonLink>
          ) : (
            <Button variant="secondary" disabled>
              next
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
};
