import { expect, test } from "./fixtures";

test("should let an admin rename the organization", async ({ organizationSettingsPage }) => {
  await organizationSettingsPage.goto();

  const originalName = await organizationSettingsPage.nameField().inputValue();

  await organizationSettingsPage.nameField().fill("Renamed E2E Org");
  await organizationSettingsPage.saveButton().click();

  await expect(organizationSettingsPage.successToast()).toBeVisible();

  await organizationSettingsPage.goto();
  await expect(organizationSettingsPage.nameField()).toHaveValue("Renamed E2E Org");

  // restore the original name so the shared e2e environment stays consistent for other runs
  await organizationSettingsPage.nameField().fill(originalName);
  await organizationSettingsPage.saveButton().click();
  await expect(organizationSettingsPage.successToast()).toBeVisible();
});
