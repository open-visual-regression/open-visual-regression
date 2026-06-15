import { vi } from "vitest";

export const serverClient = {
  setup: {
    status: vi.fn(),
    exec: vi.fn(),
  },
  projects: {
    getOne: vi.fn(),
    list: vi.fn(),
    add: vi.fn(),
  },
  apiKeys: {
    create: vi.fn(),
    list: vi.fn(),
    revoke: vi.fn(),
  },
  profile: {
    updateProfileInformation: vi.fn(),
    updatePassword: vi.fn(),
  },
  users: {
    list: vi.fn(),
    invite: vi.fn(),
    remove: vi.fn(),
  },
  invitations: {
    getInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
  },
};
