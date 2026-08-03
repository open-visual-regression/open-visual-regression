import { db } from "./db";
import * as apiKeys from "./repository/apiKeys";
import * as baselines from "./repository/baselines";
import * as buildExtractInputs from "./repository/buildExtractInputs";
import * as builds from "./repository/builds";
import * as diffReviews from "./repository/diffReviews";
import * as diffs from "./repository/diffs";
import * as gitIntegrations from "./repository/gitIntegrations";
import * as gitStatusPublications from "./repository/gitStatusPublications";
import * as organizations from "./repository/organizations";
import * as projects from "./repository/projects";
import * as snapshotLogs from "./repository/snapshotLogs";
import * as snapshots from "./repository/snapshots";
import * as storageOutbox from "./repository/storageOutbox";
import * as users from "./repository/users";

export const dbClient = {
  organizations,
  users,
  projects,
  apiKeys,
  builds,
  buildExtractInputs,
  snapshots,
  snapshotLogs,
  diffs,
  diffReviews,
  baselines,
  storageOutbox,
  gitIntegrations,
  gitStatusPublications,
  transaction: db.transaction.bind(db),
} as const;
