import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

export type DiffKeyProps = {
  kind: "removed" | "added";
};

/** Says what the tint over a snapshot means: red for removed, green for added. */
export const DiffKey = ({ kind }: DiffKeyProps) => (
  <span className="flex items-center gap-1.5">
    <span
      aria-hidden
      className={cn("size-2.5 rounded-sm", kind === "removed" ? "bg-ovr-red" : "bg-ovr-green")}
    />
    <Typography variant="caption">{kind}</Typography>
  </span>
);
