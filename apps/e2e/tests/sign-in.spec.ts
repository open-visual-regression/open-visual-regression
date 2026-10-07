import { TEST_ADMIN } from "./constants";
import { expect, test } from "./fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test("should send a signed-out user to sign in and back to the page they asked for", async ({
  page,
  seed,
  loginPage,
}) => {
  const requestPath = `/projects/${seed.projectId}/settings`;

  await page.goto(requestPath);
  await expect(page).toHaveURL(`/login?callback_url=${encodeURIComponent(requestPath)}`);

  await loginPage.emailField().fill(TEST_ADMIN.email);
  await loginPage.passwordField().fill(TEST_ADMIN.password);
  await loginPage.signInButton().click();

  await expect(page).toHaveURL(requestPath);
});
