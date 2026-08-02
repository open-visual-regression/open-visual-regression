import "server-only";
import { cache } from "react";

import { serverClient } from "@/lib/router";

export const cachedServerClient = {
  projects: {
    getOne: cache((projectId: string) => serverClient.projects.getOne({ projectId })),
  },
  builds: {
    getOne: cache((buildId: string) => serverClient.builds.getOne({ buildId })),
  },
  snapshots: {
    getOne: cache((snapshotId: string) => serverClient.snapshots.getOne({ snapshotId })),
  },
} as const;
