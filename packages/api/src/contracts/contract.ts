import { contract as apiKeysContract } from "./apiKeys";
import { contract as setupContract } from "./setup";
import { contract as projectsContract } from "./projects";
import { contract as storageContract } from "./storage";
import { contract as profileContract } from "./profile";

export const contract = {
  apiKeys: { ...apiKeysContract },
  setup: { ...setupContract },
  projects: { ...projectsContract },
  storage: { ...storageContract },
  profile: { ...profileContract },
} as const;
