import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor, within } from "@/test-utils";

import { DeleteProjectDialog } from "../DeleteProjectDialog";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockDelete = vi.mocked(serverClient.projects.deleteProject);
const mockPush = vi.mocked(useRouter)().push;

const project = mocks.project.generateProject({ name: "checkout-flow" });

const renderComponent = () => render(<DeleteProjectDialog project={project} />);

const CONFIRM_LABEL = /type checkout-flow to confirm/i;
const DELETE_BUTTON = { name: /^delete project$/i };

const openDialog = async (user: { click: (el: Element) => Promise<void> }) => {
  await user.click(screen.getByRole("button", DELETE_BUTTON));
  const dialog = await screen.findByRole("alertdialog");
  return {
    input: within(dialog).getByLabelText(CONFIRM_LABEL),
    confirm: within(dialog).getByRole("button", DELETE_BUTTON),
  };
};

describe("DeleteProjectDialog", () => {
  it("should keep the confirm button disabled until the exact project name is typed", async ({
    user,
  }) => {
    renderComponent();

    const { input, confirm } = await openDialog(user);
    expect(confirm).toBeDisabled();

    await user.type(input, "checkout");
    expect(confirm).toBeDisabled();

    await user.type(input, "-flow");
    expect(confirm).toBeEnabled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should delete the project and redirect to /projects on confirm", async ({ user }) => {
    mockDelete.mockResolvedValue([null, undefined]);
    renderComponent();

    const { input, confirm } = await openDialog(user);
    await user.type(input, "checkout-flow");
    await user.click(confirm);

    expect(mockDelete).toHaveBeenCalledWith({ id: project.id });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/projects"));
  });

  it("should surface an error and stay on the page when deletion fails", async ({ user }) => {
    mockDelete.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    const { input, confirm } = await openDialog(user);
    await user.type(input, "checkout-flow");
    await user.click(confirm);

    expect(await screen.findByRole("alert")).toHaveTextContent("INTERNAL_SERVER_ERROR");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
