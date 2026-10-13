import type { SsoReadinessRowSchema } from "@ovr/api/contracts/users";
import { Badge } from "@ovr/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@ovr/ui/components/table";
import { Typography } from "@ovr/ui/components/typography";

import { ConfirmSsoMatchButton } from "./ConfirmSsoMatchButton";
import { getSsoReadinessStatus } from "./ssoReadinessStatus";

type SsoReadinessSectionProps = {
  rows: SsoReadinessRowSchema[];
};

const getRowKey = ({ identity, user }: SsoReadinessRowSchema) => identity?.id ?? user?.id;

export const SsoReadinessSection = ({ rows }: SsoReadinessSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <Typography variant="h2" as="h2">
        sso readiness
      </Typography>
      <Typography variant="body-muted" as="p">
        how each user will sign in once SSO is enabled. confirm suggested matches so users keep
        their history.
      </Typography>
    </div>
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>SSO identity</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-px" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={5}>no users or SSO identities found</TableEmpty>
          ) : (
            rows.map((row) => {
              const status = getSsoReadinessStatus(row);

              return (
                <TableRow key={getRowKey(row)}>
                  <TableCell>{row.user?.email ?? "—"}</TableCell>
                  <TableCell>{row.identity?.email ?? "—"}</TableCell>
                  <TableCell>
                    {row.user?.role ?? "—"} → {row.identity ? (row.identity.role ?? "none") : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge color={status.color}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.match === "email" && row.identity && row.user ? (
                      <ConfirmSsoMatchButton
                        identityId={row.identity.id}
                        userId={row.user.id}
                        name={row.user.name}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);
