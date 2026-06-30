import * as account from "./account";
import * as apiKeys from "./apiKeys";
import * as builds from "./builds";
import * as diffs from "./diffs";
import * as invitations from "./invitations";
import * as projects from "./projects";
import * as setup from "./setup";
import * as snapshots from "./snapshots";
import * as storage from "./storage";
import * as users from "./users";

export const serverClient = {
  apiKeys,
  setup,
  projects,
  storage,
  builds,
  account,
  users,
  invitations,
  diffs,
  snapshots,
} as const;
