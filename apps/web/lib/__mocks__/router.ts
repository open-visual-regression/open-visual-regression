import { vi } from "vitest";
import type { serverClient as ServerClient } from "../router";

export const serverClient = {
  setup: {
    status: vi.fn(),
    exec: vi.fn(),
  },
  projects: {
    getOne: vi.fn(),
    list: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    listCaptureConfigurations: vi.fn(),
    addCaptureConfiguration: vi.fn(),
    removeCaptureConfiguration: vi.fn(),
  },
  apiKeys: {
    create: vi.fn(),
    list: vi.fn(),
    revoke: vi.fn(),
  },
  account: {
    updateAccountInformation: vi.fn(),
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
  storage: {
    getObject: vi.fn(),
  },
  builds: {
    createBuild: vi.fn(),
    getBuildStatus: vi.fn(),
    list: vi.fn(),
  },
} as unknown as typeof ServerClient;
