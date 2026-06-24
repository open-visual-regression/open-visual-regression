export const ProjectsSidebarSkeleton = () => (
  <aside className="flex h-full w-60 shrink-0 animate-pulse flex-col overflow-hidden border-r border-ovr-border bg-background">
    <div className="px-3 pt-3.5 pb-1.5">
      <div className="h-3 w-14 rounded-sm bg-ovr-border-subtle" />
    </div>
    <div className="flex flex-col gap-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex h-7 items-center gap-2 border-l-2 border-l-transparent pl-2.5 pr-3"
        >
          <div className="size-3 shrink-0 rounded-sm bg-ovr-border-subtle" />
          <div className="h-2.5 flex-1 rounded-sm bg-ovr-border-subtle" />
        </div>
      ))}
    </div>
    <div className="min-h-0 flex-1 overflow-hidden">
      <div className="px-3 pt-3.5 pb-1.5">
        <div className="h-3 w-20 rounded-sm bg-ovr-border-subtle" />
      </div>
      <div className="flex flex-col gap-2 px-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-11 flex-col justify-center gap-1.5">
            <div className="h-2 w-2/3 rounded-sm bg-ovr-border-subtle" />
            <div className="h-2.5 w-full rounded-sm bg-ovr-border-subtle" />
          </div>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-2 border-t border-ovr-border-subtle px-3 py-3">
      <div className="size-5 rounded-lg bg-ovr-border-subtle" />
      <div className="h-3 w-16 rounded-sm bg-ovr-border-subtle" />
    </div>
  </aside>
);
