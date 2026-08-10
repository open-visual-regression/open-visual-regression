import { contract as accountContract } from "./account";
import { contract as apiKeysContract } from "./apiKeys";
import { contract as buildsContract } from "./builds";
import { contract as diffsContract } from "./diffs";
import { contract as gitIntegrationsContract } from "./gitIntegrations";
import { contract as healthContract } from "./health";
import { contract as invitationsContract } from "./invitations";
import { contract as organizationsContract } from "./organizations";
import { contract as projectsContract } from "./projects";
import { contract as setupContract } from "./setup";
import { contract as snapshotsContract } from "./snapshots";
import { contract as storageContract } from "./storage";
import { contract as storybookContract } from "./storybook";
import { contract as usersContract } from "./users";

export const contract = {
  apiKeys: { ...apiKeysContract },
  health: { ...healthContract },
  setup: { ...setupContract },
  projects: { ...projectsContract },
  organizations: { ...organizationsContract },
  storage: { ...storageContract },
  storybook: { ...storybookContract },
  builds: { ...buildsContract },
  account: { ...accountContract },
  users: { ...usersContract },
  invitations: { ...invitationsContract },
  diffs: { ...diffsContract },
  snapshots: { ...snapshotsContract },
  gitIntegrations: { ...gitIntegrationsContract },
} as const;
