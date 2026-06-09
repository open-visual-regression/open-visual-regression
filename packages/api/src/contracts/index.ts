import { contract as apiKeysContract } from "./apiKeys";
import { contract as setupContract } from "./setup";

export const contract = {
  apiKeys: { ...apiKeysContract },
  setup: { ...setupContract },
} as const;
