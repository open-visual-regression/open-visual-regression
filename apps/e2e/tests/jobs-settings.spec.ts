import { expect, test } from "./fixtures";

test("should let an admin enable flaky detection with a custom build window", async ({
  jobsSettingsPage,
}) => {
  await jobsSettingsPage.goto();

  await jobsSettingsPage.flakyDetectionSwitch().click();
  await jobsSettingsPage.windowBuildsField().fill("50");
  await jobsSettingsPage.saveButton().click();

  await expect(jobsSettingsPage.successToast()).toBeVisible();

  await jobsSettingsPage.goto();
  await expect(jobsSettingsPage.flakyDetectionSwitch()).toBeChecked();
  await expect(jobsSettingsPage.windowBuildsField()).toHaveValue("50");

  await jobsSettingsPage.windowBuildsField().fill("30");
  await jobsSettingsPage.flakyDetectionSwitch().click();
  await jobsSettingsPage.saveButton().click();
  await expect(jobsSettingsPage.successToast()).toBeVisible();
});
