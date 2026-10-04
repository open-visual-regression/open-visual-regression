import { db } from "./db";
import * as accessTokens from "./repository/accessTokens";
import * as apiKeys from "./repository/apiKeys";
import * as baselines from "./repository/baselines";
import * as buildExtractDefaults from "./repository/buildExtractDefaults";
import * as builds from "./repository/builds";
import * as diffReviews from "./repository/diffReviews";
import * as diffs from "./repository/diffs";
import * as flakySnapshots from "./repository/flakySnapshots";
import * as gitIntegrations from "./repository/gitIntegrations";
import * as gitStatusPublications from "./repository/gitStatusPublications";
import * as jobSettings from "./repository/jobSettings";
import * as organizations from "./repository/organizations";
import * as projects from "./repository/projects";
import * as snapshotLogs from "./repository/snapshotLogs";
import * as snapshots from "./repository/snapshots";
import * as snapshotVariants from "./repository/snapshotVariants";
import * as storageOutbox from "./repository/storageOutbox";
import * as users from "./repository/users";

export const dbClient = {
  organizations,
  users,
  projects,
  apiKeys,
  accessTokens,
  builds,
  buildExtractDefaults,
  snapshots,
  snapshotLogs,
  snapshotVariants,
  flakySnapshots,
  diffs,
  diffReviews,
  baselines,
  storageOutbox,
  gitIntegrations,
  gitStatusPublications,
  jobSettings,
  transaction: db.transaction.bind(db),
} as const;
