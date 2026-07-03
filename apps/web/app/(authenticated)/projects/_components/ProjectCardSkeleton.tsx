import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Skeleton } from "@ovr/ui/components/skeleton";

type ProjectCardSkeletonProps = {
  ref?: React.Ref<HTMLLIElement>;
};

export const ProjectCardSkeleton = ({ ref }: ProjectCardSkeletonProps = {}) => (
  <li ref={ref} aria-hidden>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-2/3" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-full" />
          <div className="flex flex-row gap-6 items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  </li>
);
