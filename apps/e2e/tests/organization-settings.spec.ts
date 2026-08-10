import { TEST_ADMIN } from "./constants";
import { expect, test } from "./fixtures";

test("should let an admin rename the organization", async ({ organizationSettingsPage }) => {
  await organizationSettingsPage.goto();

  await organizationSettingsPage.nameField().fill("Renamed E2E Org");
  await organizationSettingsPage.saveButton().click();

  await expect(organizationSettingsPage.successToast()).toBeVisible();

  await organizationSettingsPage.goto();
  await expect(organizationSettingsPage.nameField()).toHaveValue("Renamed E2E Org");

  // restore the name the setup step provisioned, so the shared e2e environment stays
  // consistent for other runs — and so a retry starts from a known name
  await organizationSettingsPage.nameField().fill(TEST_ADMIN.organizationName);
  await organizationSettingsPage.saveButton().click();
  await expect(organizationSettingsPage.successToast()).toBeVisible();
});
