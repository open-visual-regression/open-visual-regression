export const SnapshotPageSkeleton = () => (
  <div className="absolute inset-0 flex animate-pulse flex-col">
    <div className="flex shrink-0 flex-row items-center justify-between border-b bg-ovr-elevated px-5 py-2 md:px-6 lg:px-10">
      <div className="flex flex-row items-center gap-2">
        <div className="h-7 w-16 rounded-md bg-ovr-border-subtle" />
        <div className="h-7 w-16 rounded-md bg-ovr-border-subtle" />
        <div className="h-3 w-8 rounded-sm bg-ovr-border-subtle" />
        <div className="h-7 w-16 rounded-md bg-ovr-border-subtle" />
      </div>
      <div className="flex flex-row items-center gap-2">
        <div className="h-8 w-16 rounded-md bg-ovr-border-subtle" />
        <div className="h-8 w-16 rounded-md bg-ovr-border-subtle" />
        <div className="h-7 w-7 rounded-md bg-ovr-border-subtle" />
      </div>
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-hidden px-5 py-3 md:px-6 md:py-4 lg:px-10 lg:py-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-80 max-w-full rounded-sm bg-ovr-border-subtle" />
        <div className="flex flex-row flex-wrap items-center gap-4">
          <div className="h-5 w-24 rounded-sm bg-ovr-border-subtle" />
          <div className="h-3 w-24 rounded-sm bg-ovr-border-subtle" />
          <div className="h-3 w-32 rounded-sm bg-ovr-border-subtle" />
        </div>
      </div>
      <div className="min-h-0 flex-1 rounded-card border border-ovr-border bg-ovr-elevated" />
    </div>
  </div>
);
