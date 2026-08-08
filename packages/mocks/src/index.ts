import * as apiKey from "./apiKey";
import * as build from "./build";
import * as gitIntegration from "./gitIntegration";
import * as organization from "./organization";
import * as project from "./project";
import * as session from "./session";
import * as snapshot from "./snapshot";
import * as user from "./user";

export const mocks = {
  apiKey,
  build,
  gitIntegration,
  organization,
  project,
  session,
  snapshot,
  user,
} as const;
