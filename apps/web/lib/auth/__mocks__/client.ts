import { vi } from "vitest";

export const authClient = {
  signUp: {
    email: vi.fn(),
  },
  signIn: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
};
