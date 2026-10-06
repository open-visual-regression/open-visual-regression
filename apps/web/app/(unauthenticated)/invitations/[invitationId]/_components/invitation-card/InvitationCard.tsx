import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { FieldGroup, FieldSkeleton } from "@ovr/ui/components/field";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography, TypographySkeleton } from "@ovr/ui/components/typography";

import { InvitationForm } from "./InvitationForm";

type InvitationCardProps = {
  invitationId: string;
  email: string;
  organizationName: string;
  role: string | null;
};

export const InvitationCard = ({
  invitationId,
  email,
  organizationName,
  role,
}: InvitationCardProps) => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        create your account
      </Typography>
      <Typography className="text-muted-foreground">
        invited to <span className="text-foreground">{organizationName}</span>
        {role ? (
          <>
            {" "}
            as <span className="text-ovr-accent">{role}</span>
          </>
        ) : null}
        . set a name and password to finish.
      </Typography>
    </CardHeader>
    <CardContent>
      <InvitationForm invitationId={invitationId} email={email} />
    </CardContent>
  </Card>
);

export const InvitationCardSkeleton = () => (
  <Card aria-hidden className="w-full">
    <CardHeader>
      <TypographySkeleton variant="h2" className="w-44" />
      <TypographySkeleton variant="body" className="w-full" />
    </CardHeader>
    <CardContent>
      <FieldGroup>
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <Skeleton className="h-10 w-full rounded-lg" />
      </FieldGroup>
    </CardContent>
  </Card>
);
