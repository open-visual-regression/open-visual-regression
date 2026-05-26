import { cn } from "@ovr/ui/lib/utils";

type SidebarMonogramProps = {
  name: string;
  changedCount?: number;
  active?: boolean;
};

const SidebarMonogram = ({ name, changedCount = 0, active }: SidebarMonogramProps) => {
  const monogram = name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toLowerCase();

  return (
    <div className="relative">
      <span
        className={cn(
          "text-[11px] font-semibold font-mono",
          active ? "text-ovr-fg" : "text-ovr-fg-secondary",
        )}
      >
        {monogram}
      </span>
      {changedCount > 0 && (
        <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-ovr-accent" />
      )}
    </div>
  );
};

export { SidebarMonogram };
export type { SidebarMonogramProps };
