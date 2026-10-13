import { getBaseURL, SSO_ADMIN_STORAGE_STATE, SSO_PASSWORD, SSO_USERS } from "../constants";
import { expect, test } from "../fixtures";
import { createTokenClient, seedClientForContext } from "../seed/client";
import { addToGroup, removeFromGroup } from "./keycloak";

test.describe("SSO sign-in", () => {
  test.describe("as the admin", () => {
    test.use({ storageState: SSO_ADMIN_STORAGE_STATE });

    test("should leave user management to the identity provider", async ({ usersSettingsPage }) => {
      await usersSettingsPage.goto();

      await expect(usersSettingsPage.heading()).toBeVisible();
      await expect(usersSettingsPage.inviteButton()).toBeHidden();
    });

    test("should accept a personal access token that skips the proxy", async ({ context }) => {
      const seedClient = await seedClientForContext(context);
      const { token } = await seedClient.accessTokens.create({ name: "e2e" });

      const { builds } = await createTokenClient(getBaseURL(), token).builds.list();

      expect(builds).toEqual(expect.any(Array));
    });
  });

  test("should sign a reviewer in without an OVR password", async ({
    page,
    identityProviderLoginPage,
    usersSettingsPage,
  }) => {
    await page.goto("/projects");
    await identityProviderLoginPage.signIn(SSO_USERS.reviewer, SSO_PASSWORD);
    await page.waitForURL("**/projects");

    await usersSettingsPage.goto();

    await expect(usersSettingsPage.heading()).toBeHidden();
  });

  test("should sign out through the proxy", async ({ page, identityProviderLoginPage }) => {
    await page.goto("/projects");
    await identityProviderLoginPage.signIn(SSO_USERS.reviewer, SSO_PASSWORD);
    await page.waitForURL("**/projects");
    const signOut = page.waitForRequest(/\/oauth2\/sign_out/);

    await page.getByRole("button", { name: /user menu for/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();

    await signOut;
  });

  test("should turn away someone outside the mapped groups", async ({
    page,
    identityProviderLoginPage,
    forbiddenPage,
  }) => {
    await page.goto("/projects");
    await identityProviderLoginPage.signIn(SSO_USERS.outsider, SSO_PASSWORD);

    await expect(page).toHaveURL(/\/forbidden\?reason=no-role/);
    await expect(forbiddenPage.heading()).toBeVisible();
    await expect(forbiddenPage.requestAccessLink()).toHaveAttribute(
      "href",
      "https://opal.example.com/apps/ovr",
    );
  });

  test("should turn a reviewer away once they lose access", async ({
    page,
    identityProviderLoginPage,
    forbiddenPage,
  }) => {
    await page.goto("/projects");
    await identityProviderLoginPage.signIn(SSO_USERS.reviewer, SSO_PASSWORD);
    await page.waitForURL("**/projects");

    await removeFromGroup(SSO_USERS.reviewer, "ovr-reviewers");

    try {
      await expect(async () => {
        await page.reload();
        await expect(forbiddenPage.heading()).toBeVisible({ timeout: 1_000 });
      }).toPass({ timeout: 60_000 });
    } finally {
      await addToGroup(SSO_USERS.reviewer, "ovr-reviewers");
    }
  });
});
