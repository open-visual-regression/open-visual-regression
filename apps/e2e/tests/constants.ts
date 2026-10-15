export const STORAGE_STATE = "playwright/.auth/user.json";

export const SEED_ARTIFACT = "playwright/.artifacts/seed.json";

export const SSO_ADMIN_STORAGE_STATE = "playwright/.auth/sso-admin.json";

export const SSO_PASSWORD = "e2e-password-123";

export const SSO_USERS = {
  admin: "admin@ovr.test",
  reviewer: "reviewer@ovr.test",
  outsider: "outsider@ovr.test",
} as const;

export const getIdentityProviderURL = (): string =>
  process.env.OVR_E2E_IDP_URL ?? "http://localhost:8081";

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
