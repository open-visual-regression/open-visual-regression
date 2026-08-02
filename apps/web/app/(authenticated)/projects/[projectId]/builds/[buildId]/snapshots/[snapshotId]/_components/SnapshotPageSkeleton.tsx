export const SnapshotPageSkeleton = () => (
  <div className="absolute inset-0 flex animate-pulse flex-col">
    <div className="flex items-center justify-between gap-3 border-b border-ovr-border px-4 py-2.5">
      <div className="h-6 w-40 rounded-md bg-ovr-border-subtle" />
      <div className="h-6 w-52 rounded-md bg-ovr-border-subtle" />
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div className="h-5 w-80 max-w-full rounded-sm bg-ovr-border-subtle" />
      <div className="min-h-0 flex-1 rounded-card border border-ovr-border bg-ovr-elevated" />
    </div>
  </div>
);
