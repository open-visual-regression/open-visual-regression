import { contract as setupContract } from "./setup";
import { contract as projectsContract } from "./projects";

export const contract = {
  setup: { ...setupContract },
  projects: { ...projectsContract },
} as const;
