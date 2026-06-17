import * as apiKeys from "./apiKeys";
import * as setup from "./setup";
import * as projects from "./projects";
import * as captureConfigurations from "./captureConfigurations";
import * as storage from "./storage";
import * as builds from "./builds";
import * as account from "./account";
import * as users from "./users";
import * as invitations from "./invitations";

export const serverClient = {
  apiKeys,
  setup,
  projects,
  captureConfigurations,
  storage,
  builds,
  account,
  users,
  invitations,
} as const;
