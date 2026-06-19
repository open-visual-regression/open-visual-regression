import * as apiKeys from "./apiKeys";
import * as setup from "./setup";
import * as projects from "./projects";
import * as captureConfigurations from "./captureConfigurations";
import * as storage from "./storage";
import * as builds from "./builds";
import * as account from "./account";
import * as users from "./users";
import * as invitations from "./invitations";
import * as diffs from "./diffs";
import * as snapshots from "./snapshots";

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
  diffs,
  snapshots,
} as const;
