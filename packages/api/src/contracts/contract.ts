import { contract as apiKeysContract } from "./apiKeys";
import { contract as setupContract } from "./setup";
import { contract as projectsContract } from "./projects";
import { contract as storageContract } from "./storage";
import { contract as buildsContract } from "./builds";
import { contract as accountContract } from "./account";

export const contract = {
  apiKeys: { ...apiKeysContract },
  setup: { ...setupContract },
  projects: { ...projectsContract },
  storage: { ...storageContract },
  builds: { ...buildsContract },
  account: { ...accountContract },
} as const;
