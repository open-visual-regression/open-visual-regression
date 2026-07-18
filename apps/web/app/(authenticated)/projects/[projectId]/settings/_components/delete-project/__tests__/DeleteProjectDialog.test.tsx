import { useRouter } from "next/navigation";
import { vi } from "vitest";

import { mocks } from "@ovr/mocks";

import { serverClient } from "@/lib/router";
import { createORPCError } from "@/lib/testing/orpc";
import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { DeleteProjectDialog } from "../DeleteProjectDialog";

vi.mock("@/lib/router");
vi.mock("next/navigation");

const mockDelete = vi.mocked(serverClient.projects.deleteProject);
const mockPush = vi.mocked(useRouter)().push;

const project = mocks.project.generateProject({ name: "checkout-flow" });

const renderComponent = () => render(<DeleteProjectDialog project={project} />);

const CONFIRM_LABEL = /type checkout-flow to confirm/i;

describe("DeleteProjectDialog", () => {
  it("should keep the confirm button disabled until the exact project name is typed", async ({
    user,
  }) => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /delete project…/i }));
    const input = await screen.findByLabelText(CONFIRM_LABEL);
    const confirm = screen.getByRole("button", { name: /^delete project$/i });
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

    await user.click(screen.getByRole("button", { name: /delete project…/i }));
    await user.type(await screen.findByLabelText(CONFIRM_LABEL), "checkout-flow");
    await user.click(screen.getByRole("button", { name: /^delete project$/i }));

    expect(mockDelete).toHaveBeenCalledWith({ id: project.id });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/projects"));
  });

  it("should surface an error and stay on the page when deletion fails", async ({ user }) => {
    mockDelete.mockResolvedValue([createORPCError("INTERNAL_SERVER_ERROR"), undefined]);
    renderComponent();

    await user.click(screen.getByRole("button", { name: /delete project…/i }));
    await user.type(await screen.findByLabelText(CONFIRM_LABEL), "checkout-flow");
    await user.click(screen.getByRole("button", { name: /^delete project$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("INTERNAL_SERVER_ERROR");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
