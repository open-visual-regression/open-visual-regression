import * as apiKeys from "./apiKeys";
import * as setup from "./setup";
import * as projects from "./projects";
import * as storage from "./storage";

export const serverClient = {
  apiKeys,
  setup,
  projects,
  storage,
} as const;
