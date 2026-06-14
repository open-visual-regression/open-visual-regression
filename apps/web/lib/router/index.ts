import * as apiKeys from "./apiKeys";
import * as setup from "./setup";
import * as projects from "./projects";
import * as storage from "./storage";
import * as builds from "./builds";
import * as account from "./account";
import * as users from "./users";

export const serverClient = {
  apiKeys,
  setup,
  projects,
  storage,
  builds,
  account,
  users,
} as const;
