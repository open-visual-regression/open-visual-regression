import * as apiKey from "./apiKey";
import * as build from "./build";
import * as captureConfiguration from "./captureConfiguration";
import * as organization from "./organization";
import * as project from "./project";
import * as session from "./session";
import * as user from "./user";

export const mocks = {
  apiKey,
  build,
  captureConfiguration,
  organization,
  project,
  session,
  user,
} as const;
