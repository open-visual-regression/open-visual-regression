import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import { SnapshotZoomDialog } from "../SnapshotZoomDialog";

const meta: Meta<typeof SnapshotZoomDialog> = {
  title: "Web/SnapshotZoomDialog",
  component: SnapshotZoomDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  args: {
    title: "new",
    imagePath: "/api/storage/new-desktop.png",
    alt: "snapshot of Button Primary",
  },
};

export default meta;
type Story = StoryObj<typeof SnapshotZoomDialog>;

const diffArgs = {
  diffImagePath: "/api/storage/diff-desktop.png",
  alt: "snapshot of Button Primary",
};

const openDialog = async (canvasElement: HTMLElement) => {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "zoom new" }));

  const dialog = await screen.findByRole("dialog", { name: "new" });
  const image = await within(dialog).findByRole("img", { name: "snapshot of Button Primary" });
  await waitFor(() => expect((image as HTMLImageElement).naturalWidth).toBeGreaterThan(0));

  return { dialog, image };
};

export const NoDiff: Story = {
  play: async ({ canvasElement }) => {
    await openDialog(canvasElement);
  },
};

export const WithDiff: Story = {
  args: diffArgs,
  play: async ({ canvasElement }) => {
    const { dialog } = await openDialog(canvasElement);
    await expect(within(dialog).getByRole("switch")).toBeChecked();
  },
};

export const WithDiffHidden: Story = {
  parameters: { ovr: { viewports: ["desktop"] } },
  args: diffArgs,
  play: async ({ canvasElement }) => {
    const { dialog } = await openDialog(canvasElement);
    const diffImage = within(dialog).getByRole("img", {
      name: "diff overlay of snapshot of Button Primary",
    });

    await userEvent.click(within(dialog).getByRole("switch"));

    await expect(within(dialog).getByRole("switch")).not.toBeChecked();
    await expect(diffImage).toHaveStyle({ opacity: "0" });
  },
};
