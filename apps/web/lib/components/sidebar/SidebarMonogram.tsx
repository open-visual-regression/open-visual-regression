import { cn } from "@ovr/ui/lib/utils";
import { getMonogram } from "@/lib/utils/monogram";

type SidebarMonogramProps = {
  name: string;
  changedCount?: number;
  active?: boolean;
};

const SidebarMonogram = ({ name, changedCount = 0, active }: SidebarMonogramProps) => (
  <div className="relative">
    <span
      className={cn(
        "text-label font-semibold font-mono",
        active ? "text-ovr-fg" : "text-ovr-fg-secondary",
      )}
    >
      {getMonogram(name)}
    </span>
    {changedCount > 0 ? (
      <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-ovr-accent" />
    ) : null}
  </div>
);

export { SidebarMonogram };
export type { SidebarMonogramProps };
