import { Card, CardContent } from "@ovr/ui/components/card";
import { FieldSkeleton } from "@ovr/ui/components/field";
import { TypographySkeleton } from "@ovr/ui/components/typography";

export const GitProviderConnectionsSectionSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <TypographySkeleton variant="h2" className="w-32" />
      <TypographySkeleton variant="body-muted" className="w-72" />
    </div>
    <Card>
      <CardContent className="flex flex-col gap-5">
        <FieldSkeleton />
        <FieldSkeleton />
      </CardContent>
    </Card>
  </div>
);
