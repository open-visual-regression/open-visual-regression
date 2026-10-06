import { useRouter } from "next/navigation";
import { vi } from "vitest";

import type { FlakyDetectionSettings } from "@ovr/api/contracts/jobs";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { act, describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { FlakyDetectionForm, RUNNING_POLL_INTERVAL_MS } from "../FlakyDetectionForm";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockUpdate = vi.mocked(serverClient.jobs.updateFlakyDetection);
const mockRun = vi.mocked(serverClient.jobs.runFlakyDetection);
const mockRefresh = vi.mocked(useRouter)().refresh;

const SETTINGS: FlakyDetectionSettings = {
  enabled: true,
  cron: "0 7,19 * * *",
  windowBuilds: 30,
};

const renderComponent = (settings: FlakyDetectionSettings = SETTINGS, running = false) =>
  render(
    <>
      <FlakyDetectionForm settings={settings} running={running} />
      <Toaster />
    </>,
  );

describe("FlakyDetectionForm", () => {
  it("should show the saved settings", () => {
    renderComponent();

    expect(screen.getByRole("switch", { name: /enabled/i })).toBeChecked();
    expect(screen.getByLabelText(/schedule/i)).toHaveValue("0 7,19 * * *");
    expect(screen.getByLabelText(/builds to look back on/i)).toHaveValue(30);
  });

  it("should disable the schedule and build window while detection is off and enable them once it is turned on", async ({
    user,
  }) => {
    renderComponent({ ...SETTINGS, enabled: false });

    expect(screen.getByLabelText(/schedule/i)).toBeDisabled();
    expect(screen.getByLabelText(/builds to look back on/i)).toBeDisabled();

    await user.click(screen.getByRole("switch", { name: /enabled/i }));

    expect(screen.getByLabelText(/schedule/i)).toBeEnabled();
    expect(screen.getByLabelText(/builds to look back on/i)).toBeEnabled();
  });

  it("should show a validation error and not save when the schedule is not a cron pattern", async ({
    user,
  }) => {
    renderComponent();

    await user.clear(screen.getByLabelText(/schedule/i));
    await user.type(screen.getByLabelText(/schedule/i), "twice a day");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("you must enter a valid cron pattern")).toBeVisible();
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

    await user.clear(screen.getByLabelText(/schedule/i));
    await user.type(screen.getByLabelText(/schedule/i), "0 */4 * * *");
    await user.clear(screen.getByLabelText(/builds to look back on/i));
    await user.type(screen.getByLabelText(/builds to look back on/i), "50");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled());
    expect(mockUpdate).toHaveBeenCalledWith({
      enabled: true,
      cron: "0 */4 * * *",
      windowBuilds: 50,
    });

    resolveUpdate!([null, undefined]);

    expect(await screen.findByText("flaky detection updated")).toBeVisible();
    expect(mockRefresh).toHaveBeenCalled();
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

  it("should run the job and confirm when run now is clicked", async ({ user }) => {
    mockRun.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /run now/i }));

    expect(mockRun).toHaveBeenCalled();
    expect(await screen.findByText("flaky detection started")).toBeVisible();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should disable run now while detection is off", () => {
    renderComponent({ ...SETTINGS, enabled: false });

    expect(screen.getByRole("button", { name: /run now/i })).toBeDisabled();
  });

  it("should show the error message when the job cannot be started", async ({ user }) => {
    mockRun.mockResolvedValue([createORPCError("CONFLICT", 409), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /run now/i }));

    expect(await screen.findByText("CONFLICT")).toBeVisible();
    expect(screen.queryByText("flaky detection started")).not.toBeInTheDocument();
  });

  it("should disable run now and show a spinner while the job is running", () => {
    renderComponent(SETTINGS, true);

    const button = screen.getByRole("button", { name: /running/i });
    expect(button).toBeDisabled();
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should keep refreshing while the job is running", async () => {
    vi.useFakeTimers();

    try {
      renderComponent(SETTINGS, true);
      expect(mockRefresh).not.toHaveBeenCalled();

      await act(() => vi.advanceTimersByTimeAsync(RUNNING_POLL_INTERVAL_MS * 2));

      expect(mockRefresh).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should not refresh on its own while the job is idle", async () => {
    vi.useFakeTimers();

    try {
      renderComponent();

      await act(() => vi.advanceTimersByTimeAsync(RUNNING_POLL_INTERVAL_MS * 2));

      expect(mockRefresh).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
