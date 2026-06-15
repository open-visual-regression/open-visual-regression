import * as organizations from "./repository/organizations";
import * as users from "./repository/users";
import * as invitations from "./repository/invitations";
import * as projects from "./repository/projects";
import * as apiKeys from "./repository/apiKeys";
import * as captureConfigurations from "./repository/captureConfigurations";
import * as builds from "./repository/builds";
import * as snapshots from "./repository/snapshots";
import * as diffs from "./repository/diffs";
import * as baselines from "./repository/baselines";

export const dbClient = {
  organizations,
  users,
  invitations,
  projects,
  apiKeys,
  captureConfigurations,
  builds,
  snapshots,
  diffs,
  baselines,
} as const;
