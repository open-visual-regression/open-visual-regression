import * as organizations from "./repository/organizations";
import * as users from "./repository/users";
import * as projects from "./repository/projects";
import * as apiKeys from "./repository/apiKeys";
import * as captureConfigurations from "./repository/captureConfigurations";
import * as builds from "./repository/builds";
import * as snapshots from "./repository/snapshots";
import * as snapshotLogs from "./repository/snapshotLogs";
import * as diffs from "./repository/diffs";
import * as diffReviews from "./repository/diffReviews";
import * as baselines from "./repository/baselines";

export const dbClient = {
  organizations,
  users,
  projects,
  apiKeys,
  captureConfigurations,
  builds,
  snapshots,
  snapshotLogs,
  diffs,
  diffReviews,
  baselines,
} as const;
