export const ProjectsPageSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-6">
    <div className="flex items-center justify-between">
      <div className="h-7 w-32 rounded-sm bg-ovr-border-subtle" />
      <div className="h-8 w-28 rounded-md bg-ovr-border-subtle" />
    </div>
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="h-44 rounded-card border border-ovr-border bg-ovr-elevated" />
      ))}
    </ul>
  </div>
);
