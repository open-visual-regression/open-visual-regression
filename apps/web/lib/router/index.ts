import * as apiKeys from "./apiKeys";
import * as setup from "./setup";
import * as projects from "./projects";

export const router = {
  apiKeys,
  setup,
  projects,
} as const;
