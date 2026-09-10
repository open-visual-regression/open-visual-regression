import { vi } from "vitest";

export const auth = {
  api: {
    getSession: vi.fn(),
    createUser: vi.fn(),
    signInEmail: vi.fn(),
    acceptInvitation: vi.fn(),
    createOrganization: vi.fn(),
  },
};
