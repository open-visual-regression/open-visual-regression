import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";
import { ButtonLink } from "@/lib/components/button-link/ButtonLink";

export const InvitationInvalidCard = () => (
  <Card className="w-full">
    <CardHeader>
      <Typography variant="h2" as="h1">
        invitation invalid
      </Typography>
      <Typography className="text-muted-foreground">
        this invitation has expired or is no longer valid.
      </Typography>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-4">
        <Typography className="text-muted-foreground text-sm">
          ask the admin who invited you to issue a fresh link.
        </Typography>
        <ButtonLink href="/login" variant="secondary" size="lg" className="w-full">
          return to sign in
        </ButtonLink>
      </div>
    </CardContent>
  </Card>
);
