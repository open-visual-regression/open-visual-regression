import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { vi } from "vitest";

import type { orpcServerClient as OrpcServerClient } from "../server";

type PartialClient<T> = { [K in keyof T]?: Partial<T[K]> };

export const orpcServerClient = {
  builds: {
    list: vi.fn(),
    listStatuses: vi.fn(),
    listBranches: vi.fn(),
    listAuthors: vi.fn(),
    listCommitShas: vi.fn(),
  },
  snapshots: {
    list: vi.fn(),
  },
} satisfies PartialClient<typeof OrpcServerClient>;

export const orpcServer = createTanstackQueryUtils(orpcServerClient);
