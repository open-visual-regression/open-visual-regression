import { vi } from "vitest";

export const auth = {
  api: {
    getSession: vi.fn(),
    createUser: vi.fn(),
    createOrganization: vi.fn(),
  },
};
