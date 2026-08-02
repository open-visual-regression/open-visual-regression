export const ProjectPageSkeleton = () => (
  <div className="flex h-full min-h-0 animate-pulse flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="h-7 w-56 rounded-sm bg-ovr-border-subtle" />
      <div className="h-8 w-24 rounded-md bg-ovr-border-subtle" />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-md bg-ovr-border-subtle" />
        ))}
      </div>
      <div className="h-8 min-w-0 flex-1 rounded-md bg-ovr-border-subtle lg:w-64 lg:flex-none" />
    </div>
    <div className="flex flex-col gap-px overflow-hidden rounded-card border border-ovr-border">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-11 bg-ovr-elevated" />
      ))}
    </div>
  </div>
);
