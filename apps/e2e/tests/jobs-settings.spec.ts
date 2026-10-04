import { expect, test } from "./fixtures";

test("should let an admin enable flaky detection with custom thresholds", async ({
  jobsSettingsPage,
}) => {
  await jobsSettingsPage.goto();

  await jobsSettingsPage.flakyDetectionSwitch().click();
  await jobsSettingsPage.minRevertsField().fill("4");
  await jobsSettingsPage.saveButton().click();

  await expect(jobsSettingsPage.successToast()).toBeVisible();

  await jobsSettingsPage.goto();
  await expect(jobsSettingsPage.flakyDetectionSwitch()).toBeChecked();
  await expect(jobsSettingsPage.minRevertsField()).toHaveValue("4");

  await jobsSettingsPage.minRevertsField().fill("2");
  await jobsSettingsPage.flakyDetectionSwitch().click();
  await jobsSettingsPage.saveButton().click();
  await expect(jobsSettingsPage.successToast()).toBeVisible();
});
