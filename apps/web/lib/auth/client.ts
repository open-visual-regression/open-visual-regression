import { apiKeyClient } from "@better-auth/api-key/client";
import { createAuthClient } from "better-auth/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  plugins: [adminClient(), apiKeyClient(), organizationClient()],
});
