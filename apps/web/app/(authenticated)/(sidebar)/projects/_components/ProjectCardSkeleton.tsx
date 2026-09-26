import { CardContent, CardHeader } from "@ovr/ui/components/card";
import { TypographySkeleton } from "@ovr/ui/components/typography";

import { CardSurface } from "@/lib/components/card-link/CardSurface";

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "./DescriptionList";

type ProjectCardSkeletonProps = {
  ref?: React.Ref<HTMLLIElement>;
  className?: string;
};

export const ProjectCardSkeleton = ({ ref, className }: ProjectCardSkeletonProps = {}) => (
  <li ref={ref} aria-hidden className={className}>
    <CardSurface>
      <CardHeader>
        <TypographySkeleton variant="h3" className="w-2/3" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <TypographySkeleton variant="body" className="w-full" />
          <DescriptionList>
            <DescriptionListItem>
              <DescriptionTerm>
                <TypographySkeleton variant="body" className="w-12" />
              </DescriptionTerm>
              <DescriptionDetails>
                <TypographySkeleton variant="body" className="w-4" />
              </DescriptionDetails>
            </DescriptionListItem>
            <DescriptionListItem>
              <DescriptionTerm>
                <TypographySkeleton variant="body" className="w-14" />
              </DescriptionTerm>
              <DescriptionDetails>
                <TypographySkeleton variant="body" className="w-16" />
              </DescriptionDetails>
            </DescriptionListItem>
          </DescriptionList>
        </div>
      </CardContent>
    </CardSurface>
  </li>
);
