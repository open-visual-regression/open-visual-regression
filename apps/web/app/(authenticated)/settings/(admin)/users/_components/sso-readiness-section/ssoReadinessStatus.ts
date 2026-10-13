import type { SsoReadinessRowSchema } from "@ovr/api/contracts/users";

type SsoReadinessStatus = {
  label: string;
  color: "green" | "amber" | "red" | "gray";
};

export const getSsoReadinessStatus = ({
  identity,
  user,
  match,
}: SsoReadinessRowSchema): SsoReadinessStatus => {
  if (!identity) {
    return { label: "not seen", color: "amber" };
  }

  if (!identity.role) {
    return { label: "no access", color: "red" };
  }

  if (!user) {
    return { label: "new user", color: "gray" };
  }

  if (match === "email") {
    return { label: "unconfirmed", color: "amber" };
  }

  if (user.role !== identity.role) {
    return { label: "role changes", color: "amber" };
  }

  return { label: "ready", color: "green" };
};
