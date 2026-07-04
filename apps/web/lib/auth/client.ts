import { apiKeyClient } from "@better-auth/api-key/client";
import { createAuthClient } from "better-auth/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";

// No baseURL: the auth API is served from the same origin as the app, so the
// client resolves it from window.location at runtime. This keeps the public URL
// out of the build so one image works on any domain.
export const authClient = createAuthClient({
  plugins: [adminClient(), apiKeyClient(), organizationClient()],
});
