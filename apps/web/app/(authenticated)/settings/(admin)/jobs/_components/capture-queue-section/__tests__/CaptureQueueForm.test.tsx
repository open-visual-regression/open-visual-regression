import { useRouter } from "next/navigation";
import { vi } from "vitest";

import type { CaptureQueue } from "@ovr/api/contracts/jobs";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { CaptureQueueForm, POLICY_DESCRIPTIONS } from "../CaptureQueueForm";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockUpdate = vi.mocked(serverClient.jobs.updateCaptureQueue);
const mockRefresh = vi.mocked(useRouter)().refresh;

const renderComponent = (props: Partial<CaptureQueue> = {}) =>
  render(
    <>
      <CaptureQueueForm settings={{ policy: "deadline" }} envPolicy={null} {...props} />
      <Toaster />
    </>,
  );

describe("CaptureQueueForm", () => {
  it("should show the saved policy and what it does", () => {
    renderComponent({ settings: { policy: "round-robin" } });

    expect(screen.getByRole("combobox", { name: /policy/i })).toHaveTextContent("round-robin");
    expect(screen.getByText(POLICY_DESCRIPTIONS["round-robin"])).toBeVisible();
  });

  it("should save the chosen policy", async ({ user }) => {
    mockUpdate.mockResolvedValue([null, undefined]);
    renderComponent();

    await user.click(screen.getByRole("combobox", { name: /policy/i }));
    await user.click(await screen.findByRole("option", { name: "fifo" }));

    expect(screen.getByText(POLICY_DESCRIPTIONS.fifo)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ policy: "fifo" }));
    expect(await screen.findByText("capture queue updated")).toBeVisible();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should show the error when saving fails", async ({ user }) => {
    mockUpdate.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("INTERNAL_SERVER_ERROR")).toBeVisible();
  });

  it("should show the policy the server sets and not let it be changed", () => {
    renderComponent({ settings: { policy: "round-robin" }, envPolicy: "fifo" });

    expect(screen.getByRole("alert")).toHaveTextContent(/OVR_CAPTURE_QUEUE_POLICY is set to fifo/);
    expect(screen.getByRole("combobox", { name: /policy/i })).toHaveTextContent("fifo");
    expect(screen.getByRole("combobox", { name: /policy/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });
});
