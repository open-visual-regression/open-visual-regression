export const STORAGE_STATE = "playwright/.auth/user.json";

export const SEED_ARTIFACT = "playwright/.artifacts/seed.json";

export const TEST_ADMIN = {
  organizationName: "E2E Org",
  name: "E2E Admin",
  email: "e2e-admin@ovr.test",
  password: "e2e-password-123",
} as const;

export const getBaseURL = (): string => process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export type SeedData = {
  projectId: string;
  apiKey: string;
};
