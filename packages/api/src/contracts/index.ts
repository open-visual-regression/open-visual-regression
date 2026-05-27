import { contract as setupContract } from "./setup";

export const contract = {
  setup: { ...setupContract },
} as const;
