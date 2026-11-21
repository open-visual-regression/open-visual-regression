import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { DiffSettingsForm } from "../DiffSettingsForm";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockUpdate = vi.mocked(serverClient.settings.updateDiff);
const mockRefresh = vi.mocked(useRouter)().refresh;

const renderComponent = (algorithm: "aligned" | "pixel" = "aligned") =>
  render(
    <>
      <DiffSettingsForm settings={{ algorithm }} />
      <Toaster />
    </>,
  );

describe("DiffSettingsForm", () => {
  it("should show the saved choice and what it does", () => {
    renderComponent("aligned");

    expect(screen.getByRole("combobox", { name: /highlight/i })).toHaveTextContent("smart");
    expect(screen.getByText("marks what changed, not what moved")).toBeVisible();
  });

  it("should save the chosen algorithm and disable the button while saving", async ({ user }) => {
    let resolveUpdate: (result: [null, undefined]) => void = () => {};
    mockUpdate.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    renderComponent("aligned");

    await user.click(screen.getByRole("combobox", { name: /highlight/i }));
    await user.click(await screen.findByRole("option", { name: "exact" }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled());
    expect(mockUpdate).toHaveBeenCalledWith({ algorithm: "pixel" });

    resolveUpdate([null, undefined]);

    expect(await screen.findByText("diff settings saved")).toBeVisible();
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
    expect(screen.queryByText("diff settings saved")).not.toBeInTheDocument();
  });
});
