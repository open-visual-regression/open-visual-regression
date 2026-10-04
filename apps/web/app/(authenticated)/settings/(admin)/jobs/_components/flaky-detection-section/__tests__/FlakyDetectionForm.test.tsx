import { vi } from "vitest";

import type { FlakyDetectionSettings } from "@ovr/api/contracts/jobs";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { FlakyDetectionForm } from "../FlakyDetectionForm";

vi.mock("@/lib/router");

const mockUpdate = vi.mocked(serverClient.jobs.updateFlakyDetection);

const SETTINGS: FlakyDetectionSettings = {
  enabled: true,
  cron: "17 */6 * * *",
  windowBuilds: 30,
  minReverts: 2,
  minSamples: 10,
  minChangeRate: 0.5,
};

const renderComponent = (settings: FlakyDetectionSettings = SETTINGS) =>
  render(
    <>
      <FlakyDetectionForm settings={settings} />
      <Toaster />
    </>,
  );

describe("FlakyDetectionForm", () => {
  it("should show the saved settings", () => {
    renderComponent();

    expect(screen.getByRole("switch", { name: /detect flaky stories/i })).toBeChecked();
    expect(screen.getByRole("combobox", { name: /schedule/i })).toHaveTextContent("every 6 hours");
    expect(screen.getByLabelText(/builds to look back on/i)).toHaveValue(30);
    expect(screen.getByLabelText(/returns to an earlier look/i)).toHaveValue(2);
    expect(screen.getByLabelText(/captures before the change rate counts/i)).toHaveValue(10);
    expect(screen.getByLabelText(/change rate$/i)).toHaveValue(0.5);
  });

  it("should show a saved schedule that is not a preset as a custom cron pattern", () => {
    renderComponent({ ...SETTINGS, cron: "0 */12 * * *" });

    expect(screen.getByRole("combobox", { name: /schedule/i })).toHaveTextContent("custom");
    expect(screen.getByLabelText(/cron pattern/i)).toHaveValue("0 */12 * * *");
  });

  it("should ask for a cron pattern once a custom schedule is chosen", async ({ user }) => {
    renderComponent();

    expect(screen.queryByLabelText(/cron pattern/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: /schedule/i }));
    await user.click(await screen.findByRole("option", { name: "custom" }));

    expect(screen.getByLabelText(/cron pattern/i)).toBeVisible();
  });

  it("should disable the schedule and thresholds while detection is off and enable them once it is turned on", async ({
    user,
  }) => {
    renderComponent({ ...SETTINGS, enabled: false });

    expect(screen.getByLabelText(/builds to look back on/i)).toBeDisabled();
    expect(screen.getByLabelText(/change rate$/i)).toBeDisabled();

    await user.click(screen.getByRole("switch", { name: /detect flaky stories/i }));

    expect(screen.getByLabelText(/builds to look back on/i)).toBeEnabled();
    expect(screen.getByLabelText(/change rate$/i)).toBeEnabled();
  });

  it("should show a validation error and not save when the change rate is above 1", async ({
    user,
  }) => {
    renderComponent();

    await user.clear(screen.getByLabelText(/change rate$/i));
    await user.type(screen.getByLabelText(/change rate$/i), "1.5");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("the change rate must be 1 or less")).toBeVisible();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should save the settings and disable the button while saving", async ({ user }) => {
    let resolveUpdate: (result: [null, undefined]) => void;
    mockUpdate.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    renderComponent();

    await user.clear(screen.getByLabelText(/returns to an earlier look/i));
    await user.type(screen.getByLabelText(/returns to an earlier look/i), "3");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled());
    expect(mockUpdate).toHaveBeenCalledWith({ ...SETTINGS, minReverts: 3 });

    resolveUpdate!([null, undefined]);

    expect(await screen.findByText("flaky detection updated")).toBeVisible();
  });

  it("should save a custom cron pattern as the schedule", async ({ user }) => {
    mockUpdate.mockResolvedValue([null, undefined]);
    renderComponent({ ...SETTINGS, cron: "0 */12 * * *" });

    await user.clear(screen.getByLabelText(/cron pattern/i));
    await user.type(screen.getByLabelText(/cron pattern/i), "0 */4 * * *");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({ ...SETTINGS, cron: "0 */4 * * *" }),
    );
  });

  it("should show the error message when saving fails", async ({ user }) => {
    mockUpdate.mockResolvedValue([
      {
        message: "something went wrong",
        code: "INTERNAL_SERVER_ERROR",
        status: 500,
        data: undefined,
        defined: false,
      },
      undefined,
    ]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("something went wrong");
    expect(screen.queryByText("flaky detection updated")).not.toBeInTheDocument();
  });
});
