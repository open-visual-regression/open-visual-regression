import { Card, CardContent, CardFooter } from "@ovr/ui/components/card";
import { FieldGroup, FieldSkeleton } from "@ovr/ui/components/field";
import { Skeleton } from "@ovr/ui/components/skeleton";

export const GitIntegrationFormSkeleton = () => (
  <Card size="default" aria-hidden>
    <CardContent className="flex flex-col gap-5">
      <FieldGroup>
        <FieldSkeleton />
      </FieldGroup>
      <FieldGroup>
        <FieldSkeleton />
      </FieldGroup>
      <FieldGroup>
        <FieldSkeleton />
      </FieldGroup>
    </CardContent>
    <CardFooter className="flex flex-row justify-end">
      <Skeleton className="h-8 w-16 rounded-lg" />
    </CardFooter>
  </Card>
);
