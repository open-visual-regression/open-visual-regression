import type { SsoReadinessRowSchema } from "@ovr/api/contracts/users";
import type { SsoIdentityDbSchema } from "@ovr/db/repository/ssoIdentities";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

export const getSsoReadinessRows = (
  members: Member[],
  identities: SsoIdentityDbSchema[],
): SsoReadinessRowSchema[] => {
  const identityRows = identities.map((identity): SsoReadinessRowSchema => {
    const confirmed = members.find((member) => member.id === identity.userId);
    const suggested = members.find(
      (member) => member.email.toLowerCase() === identity.email.toLowerCase(),
    );
    const user = confirmed ?? suggested ?? null;

    return {
      identity: {
        id: identity.id,
        email: identity.email,
        name: identity.name,
        role: identity.role,
        lastSeenAt: identity.lastSeenAt,
      },
      user,
      match: confirmed ? "confirmed" : suggested ? "email" : "none",
    };
  });

  const matchedUserIds = new Set(identityRows.flatMap(({ user }) => (user ? [user.id] : [])));

  const unmatchedRows = members
    .filter((member) => !matchedUserIds.has(member.id))
    .map((member): SsoReadinessRowSchema => ({ identity: null, user: member, match: "none" }));

  return [...identityRows, ...unmatchedRows];
};
