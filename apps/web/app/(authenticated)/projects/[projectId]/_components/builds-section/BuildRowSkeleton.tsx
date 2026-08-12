import { BadgeSkeleton } from "@ovr/ui/components/badge";
import { TypographySkeleton } from "@ovr/ui/components/typography";

type BuildRowSkeletonProps = {
  ref?: React.Ref<HTMLLIElement>;
  className?: string;
};

export const BuildRowSkeleton = ({ ref, className }: BuildRowSkeletonProps = {}) => (
  <li ref={ref} aria-hidden className={className}>
    <div className="flex min-w-0 flex-col gap-1.5 border-l-3 border-ovr-border-subtle py-2.5 pr-4 pl-3">
      <div className="flex min-w-0 items-center gap-2">
        <BadgeSkeleton size="sm" className="w-20" />
        <TypographySkeleton className="min-w-0 w-full flex-1" />
      </div>
      <div className="flex flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
        <TypographySkeleton variant="body-muted" className="w-24" />
        <TypographySkeleton variant="body-muted" className="w-14" />
        <TypographySkeleton variant="body-muted" className="w-20" />
        <TypographySkeleton variant="body-muted" className="w-24" />
      </div>
    </div>
  </li>
);
