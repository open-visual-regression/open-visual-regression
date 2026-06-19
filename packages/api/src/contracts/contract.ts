import { contract as apiKeysContract } from "./apiKeys";
import { contract as setupContract } from "./setup";
import { contract as projectsContract } from "./projects";
import { contract as captureConfigurationsContract } from "./captureConfigurations";
import { contract as storageContract } from "./storage";
import { contract as buildsContract } from "./builds";
import { contract as accountContract } from "./account";
import { contract as usersContract } from "./users";
import { contract as invitationsContract } from "./invitations";
import { contract as diffsContract } from "./diffs";

export const contract = {
  apiKeys: { ...apiKeysContract },
  setup: { ...setupContract },
  projects: { ...projectsContract },
  captureConfigurations: { ...captureConfigurationsContract },
  storage: { ...storageContract },
  builds: { ...buildsContract },
  account: { ...accountContract },
  users: { ...usersContract },
  invitations: { ...invitationsContract },
  diffs: { ...diffsContract },
} as const;
