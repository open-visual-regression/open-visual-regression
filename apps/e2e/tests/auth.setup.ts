import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test as setup } from "@playwright/test";

import { SEED_ARTIFACT, STORAGE_STATE, TEST_ADMIN } from "./constants";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { seedClientForContext } from "./seed/client";

setup("provision the test fixtures", async ({ page, context }) => {
  const setupPage = new SetupPage(page);
  await setupPage.goto();

  // Skip first-run setup when the stack is reused across runs or retries.
  const needsSetup = await setupPage
    .organizationNameField()
    .isVisible()
    .catch(() => false);

  if (needsSetup) {
    await setupPage.organizationNameField().fill(TEST_ADMIN.organizationName);
    await setupPage.nextButton().click();

    await setupPage.nameField().fill(TEST_ADMIN.name);
    await setupPage.emailField().fill(TEST_ADMIN.email);
    await setupPage.passwordField().fill(TEST_ADMIN.password);
    await setupPage.confirmPasswordField().fill(TEST_ADMIN.password);
    await setupPage.createButton().click();

    await expect(page).toHaveURL(/\/login/);
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.emailField().fill(TEST_ADMIN.email);
  await loginPage.passwordField().fill(TEST_ADMIN.password);
  await loginPage.signInButton().click();
  await page.waitForURL("**/projects");

  await context.storageState({ path: STORAGE_STATE });

  // Provision the project and API key over the API with the signed-in session.
  const client = await seedClientForContext(context);

  const { projectId } = await client.projects.add({
    projectName: "E2E Storybook",
    projectDescription: "Project used by the E2E ingestion test",
    gitMainBranch: "main",
  });

  const { key } = await client.apiKeys.create({ projectId, name: "e2e" });

  await mkdir(path.dirname(SEED_ARTIFACT), { recursive: true });
  await writeFile(SEED_ARTIFACT, JSON.stringify({ projectId, apiKey: key }, null, 2));
});
