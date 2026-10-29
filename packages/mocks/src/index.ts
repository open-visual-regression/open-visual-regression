import * as accessToken from "./accessToken";
import * as apiKey from "./apiKey";
import * as build from "./build";
import * as githubApp from "./githubApp";
import * as gitIntegration from "./gitIntegration";
import * as organization from "./organization";
import * as project from "./project";
import * as session from "./session";
import * as user from "./user";

export const mocks = {
  accessToken,
  apiKey,
  build,
  gitIntegration,
  githubApp,
  organization,
  project,
  session,
  user,
} as const;
