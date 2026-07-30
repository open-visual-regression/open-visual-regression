import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";

import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

import { AcceptInvitationButton } from "./AcceptInvitationButton";
import { CreateAccountForm } from "./CreateAccountForm";
import { SignOutButton } from "./SignOutButton";

export type InvitationCardMode = "create" | "signIn" | "accept" | "wrongAccount";

type InvitationCardProps = {
  mode: InvitationCardMode;
  invitationId: string;
  email: string;
  organizationName: string;
  role: string | null;
  sessionEmail?: string | null;
};

const TITLES: Record<InvitationCardMode, string> = {
  create: "create your account",
  signIn: "sign in to accept",
  accept: "accept your invitation",
  wrongAccount: "signed in as someone else",
};

export const InvitationCard = ({
  mode,
  invitationId,
  email,
  organizationName,
  role,
  sessionEmail = null,
}: InvitationCardProps) => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        {TITLES[mode]}
      </Typography>
      <Typography className="text-muted-foreground">
        {mode === "wrongAccount" ? (
          <>
            this invitation is for <span className="text-foreground">{email}</span>, but you are
            signed in as <span className="text-foreground">{sessionEmail}</span>.
          </>
        ) : (
          <>
            <span className="text-foreground">{email}</span> is invited to{" "}
            <span className="text-foreground">{organizationName}</span>
            {role ? (
              <>
                {" "}
                as <span className="text-ovr-accent">{role}</span>
              </>
            ) : null}
            {mode === "create" ? ". set a name and password to finish." : null}
            {mode === "signIn" ? ". this email already has an account." : null}
          </>
        )}
      </Typography>
    </CardHeader>
    <CardContent>
      {mode === "create" ? <CreateAccountForm invitationId={invitationId} email={email} /> : null}
      {mode === "accept" ? <AcceptInvitationButton invitationId={invitationId} /> : null}
      {mode === "signIn" ? (
        <ButtonLink
          href={`/login?redirect=/invitations/${invitationId}`}
          size="lg"
          className="w-full"
        >
          sign in
        </ButtonLink>
      ) : null}
      {mode === "wrongAccount" ? <SignOutButton /> : null}
    </CardContent>
  </Card>
);
