import type { GitProvider } from "@ovr/db/schema";

import type { Adapter } from "../publisher";
import { githubFamilyAdapter } from "./githubFamily";

export const resolveAdapter = (provider: GitProvider): Adapter => {
  switch (provider) {
    case "github":
      return githubFamilyAdapter;
  }
};
