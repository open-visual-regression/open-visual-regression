import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";

import { InvitationForm } from "./InvitationForm";

type InvitationCardProps = {
  invitationId: string;
  email: string;
  organizationName: string;
  role: string | null;
  hasAccount: boolean;
};

export const InvitationCard = ({
  invitationId,
  email,
  organizationName,
  role,
  hasAccount,
}: InvitationCardProps) => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        {hasAccount ? "accept your invitation" : "create your account"}
      </Typography>
      <Typography className="text-muted-foreground">
        invited to <span className="text-foreground">{organizationName}</span>
        {role ? (
          <>
            {" "}
            as <span className="text-ovr-accent">{role}</span>
          </>
        ) : null}
        {hasAccount
          ? ". this email already has an account — sign in to join."
          : ". set a name and password to finish."}
      </Typography>
    </CardHeader>
    <CardContent>
      <InvitationForm invitationId={invitationId} email={email} hasAccount={hasAccount} />
    </CardContent>
  </Card>
);
