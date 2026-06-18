import Link from "next/link";
import { type BuildSnapshotSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import { SnapshotCard } from "./SnapshotCard";

type SnapshotFilter = "all" | "changed" | "pass";

const FILTERS: SnapshotFilter[] = ["all", "changed", "pass"];

const matchesFilter = (status: SnapshotDisplayStatus, filter: SnapshotFilter) =>
  filter === "all" || status === filter;

type SnapshotGridProps = {
  snapshots: BuildSnapshotSchema[];
  projectId: string;
  buildId: string;
  filter: SnapshotFilter;
};

export const SnapshotGrid = ({ snapshots, projectId, buildId, filter }: SnapshotGridProps) => {
  const filtered = snapshots.filter((snapshot) => matchesFilter(snapshot.status, filter));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center gap-1 border-b border-ovr-border-subtle">
        {FILTERS.map((f) => {
          const count =
            f === "all" ? snapshots.length : snapshots.filter((s) => s.status === f).length;
          const active = filter === f;

          return (
            <Link
              key={f}
              href={f === "all" ? `?` : `?filter=${f}`}
              aria-current={active ? "true" : undefined}
              className={`flex items-center gap-1.5 border-b-2 px-2.5 py-1.5 text-xs ${
                active
                  ? "border-ovr-accent text-ovr-fg"
                  : "border-transparent text-ovr-fg-tertiary hover:text-ovr-fg"
              }`}
            >
              {f}
              <span className="text-ovr-fg-muted">{count}</span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-body-sm text-ovr-fg-secondary">no snapshots match this filter.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {filtered.map((snapshot) => (
            <SnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              projectId={projectId}
              buildId={buildId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export type { SnapshotFilter };
