import { Badge } from "@ovr/ui/components/badge";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@ovr/ui/components/card";

type ConnectionsErrorCardProps = {
  label: string;
  error: string;
};

export const ConnectionsErrorCard = ({ label, error }: ConnectionsErrorCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{label}</CardTitle>
      <CardDescription>{error}</CardDescription>
      <CardAction>
        <Badge color="red">error</Badge>
      </CardAction>
    </CardHeader>
  </Card>
);
