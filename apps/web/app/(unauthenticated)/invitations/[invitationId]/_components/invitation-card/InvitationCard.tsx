import { ButtonSkeleton } from "@ovr/ui/components/button";
import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { FieldGroup, FieldSkeleton } from "@ovr/ui/components/field";
import { Skeleton } from "@ovr/ui/components/skeleton";
import { Typography } from "@ovr/ui/components/typography";
import { cn } from "@ovr/ui/lib/utils";

import { InvitationForm } from "./InvitationForm";

type InvitationCardShellProps = {
  description: React.ReactNode;
  children: React.ReactNode;
};

const InvitationCardShell = ({ description, children }: InvitationCardShellProps) => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        create your account
      </Typography>
      {description}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

type InvitationDescriptionProps = {
  organizationName: React.ReactNode;
  role: React.ReactNode;
};

// Shared by the card and its skeleton, so the skeleton's sentence wraps like the real one.
const InvitationDescription = ({ organizationName, role }: InvitationDescriptionProps) => (
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
);

const InlineSkeleton = ({ className }: { className: string }) => (
  <Skeleton className={cn("inline-block h-3 align-middle", className)} />
);

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
  <InvitationCardShell
    description={<InvitationDescription organizationName={organizationName} role={role} />}
  >
    <InvitationForm invitationId={invitationId} email={email} />
  </InvitationCardShell>
);

export const InvitationCardSkeleton = () => (
  <InvitationCardShell
    description={
      <InvitationDescription
        organizationName={<InlineSkeleton className="w-16" />}
        role={<InlineSkeleton className="w-12" />}
      />
    }
  >
    <FieldGroup aria-hidden>
      <FieldSkeleton label="email" />
      <FieldSkeleton label="name" />
      <FieldSkeleton label="password" />
      <FieldSkeleton label="confirm password" />
      <ButtonSkeleton size="lg" className="w-full">
        create account
      </ButtonSkeleton>
    </FieldGroup>
  </InvitationCardShell>
);
