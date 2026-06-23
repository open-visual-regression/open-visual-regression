import { db } from "./db";
import * as organizations from "./repository/organizations";
import * as users from "./repository/users";
import * as projects from "./repository/projects";
import * as apiKeys from "./repository/apiKeys";
import * as builds from "./repository/builds";
import * as snapshots from "./repository/snapshots";
import * as snapshotLogs from "./repository/snapshotLogs";
import * as diffs from "./repository/diffs";
import * as diffReviews from "./repository/diffReviews";
import * as baselines from "./repository/baselines";
import * as storageOutbox from "./repository/storageOutbox";

export const dbClient = {
  organizations,
  users,
  projects,
  apiKeys,
  builds,
  snapshots,
  snapshotLogs,
  diffs,
  diffReviews,
  baselines,
  storageOutbox,
  transaction: db.transaction.bind(db),
} as const;
