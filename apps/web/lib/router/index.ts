import * as apiKeys from "./apiKeys";
import * as setup from "./setup";
import * as projects from "./projects";
import * as storage from "./storage";
import * as builds from "./builds";

export const serverClient = {
  apiKeys,
  setup,
  projects,
  storage,
  builds,
} as const;
