import type { AccessTokenPermissions } from "@ovr/api/contracts/accessTokens";

type OptionalPermission = {
  resource: keyof AccessTokenPermissions;
  action: "write";
};

// Every access token can read builds, so only these are offered when creating one.
export const OPTIONAL_PERMISSIONS: OptionalPermission[] = [
  { resource: "builds", action: "write" },
  { resource: "reviews", action: "write" },
];
