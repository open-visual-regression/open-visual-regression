import { vi } from "vitest";

import type { authClient as AuthClient } from "../client";

export const authClient = {
  signIn: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
} as unknown as typeof AuthClient;
