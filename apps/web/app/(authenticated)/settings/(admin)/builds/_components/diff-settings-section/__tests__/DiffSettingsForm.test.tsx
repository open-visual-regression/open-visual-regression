import { useRouter } from "next/navigation";
import { vi } from "vitest";

import type { DiffHighlight } from "@ovr/api/contracts/settings";
import { Toaster } from "@ovr/ui/components/sonner";

import { serverClient } from "@/lib/router";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { DiffSettingsForm } from "../DiffSettingsForm";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockUpdate = vi.mocked(serverClient.settings.updateDiffSettings);
const mockRefresh = vi.mocked(useRouter)().refresh;

const renderComponent = (highlight: DiffHighlight = "smart") =>
  render(
    <>
      <DiffSettingsForm settings={{ highlight }} />
      <Toaster />
    </>,
  );

describe("DiffSettingsForm", () => {
  it("should show the saved choice and what it does", () => {
    renderComponent("smart");

    expect(screen.getByRole("combobox", { name: /highlight/i })).toHaveTextContent("smart");
    expect(screen.getByText("highlights only the content that has changed")).toBeVisible();
  });

  it("should save the chosen highlight and disable the button while saving", async ({ user }) => {
    let resolveUpdate: (result: [null, undefined]) => void = () => {};
    mockUpdate.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    renderComponent("smart");

    await user.click(screen.getByRole("combobox", { name: /highlight/i }));
    await user.click(await screen.findByRole("option", { name: "exact" }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled());
    expect(mockUpdate).toHaveBeenCalledWith({ highlight: "exact" });

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
