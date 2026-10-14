import { test as setup } from "@playwright/test";

import { SSO_ADMIN_STORAGE_STATE, SSO_PASSWORD, SSO_USERS } from "../constants";
import { IdentityProviderLoginPage } from "../pages/IdentityProviderLoginPage";

setup("sign the first admin in through SSO", async ({ page, context }) => {
  await page.goto("/projects");
  await new IdentityProviderLoginPage(page).signIn(SSO_USERS.admin, SSO_PASSWORD);
  await page.waitForURL("**/projects");

  await context.storageState({ path: SSO_ADMIN_STORAGE_STATE });
});
