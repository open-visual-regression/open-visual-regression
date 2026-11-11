import type { AccessTokenPermissions, TokenPermissions } from "@ovr/api/contracts/accessTokens";

type OptionalPermission = {
  resource: keyof AccessTokenPermissions;
  action: "write";
  label: string;
};

// Every access token can read builds, so only these are offered when creating one.
export const OPTIONAL_PERMISSIONS: OptionalPermission[] = [
  { resource: "builds", action: "write", label: "cancel and rebuild builds" },
  { resource: "reviews", action: "write", label: "approve and reject snapshots" },
];

const PERMISSION_LABELS: Record<string, string> = {
  "builds:read": "read builds",
  "builds:write": "cancel and rebuild",
  "reviews:write": "approve and reject",
};

export const describePermissions = (permissions: TokenPermissions): string[] =>
  Object.entries(permissions).flatMap(([resource, actions]) =>
    actions.map((action) => PERMISSION_LABELS[`${resource}:${action}`] ?? `${action} ${resource}`),
  );
