import * as apiKey from "./apiKey";
import * as build from "./build";
import * as organization from "./organization";
import * as project from "./project";
import * as session from "./session";
import * as user from "./user";

export const mocks = {
  apiKey,
  build,
  organization,
  project,
  session,
  user,
} as const;
