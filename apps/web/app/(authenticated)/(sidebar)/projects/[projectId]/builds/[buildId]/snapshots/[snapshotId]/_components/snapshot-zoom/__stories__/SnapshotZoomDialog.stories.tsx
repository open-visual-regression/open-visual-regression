import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

import { ComparisonModeProvider } from "../../snapshot-comparison-section/comparison-view/comparison-mode";
import { SnapshotZoomDialog } from "../SnapshotZoomDialog";
import { SnapshotZoomTrigger } from "../SnapshotZoomTrigger";

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
    baseline: null,
    newSnapshot: {
      imagePath: "/api/storage/new-desktop.png",
      alt: "snapshot of Button Primary",
    },
    diffImagePath: null,
  },
  render: (args) => (
    <ComparisonModeProvider>
      <SnapshotZoomDialog {...args}>
        <div className="flex gap-4 p-4">
          <div className="relative size-24">
            <SnapshotZoomTrigger view="baseline" disabled={!args.baseline} />
          </div>
          <div className="relative size-24">
            <SnapshotZoomTrigger view="new" />
          </div>
        </div>
      </SnapshotZoomDialog>
    </ComparisonModeProvider>
  ),
};

export default meta;
type Story = StoryObj<typeof SnapshotZoomDialog>;

const comparisonArgs = {
  baseline: {
    imagePath: "/api/storage/baseline-desktop.png",
    alt: "baseline snapshot of Button Primary",
    commitSha: "abc1234567890",
    commitUrl: "https://github.com/acme/web/commit/abc1234567890",
  },
  diffImagePath: "/api/storage/diff-desktop.png",
};

const openDialog = async (canvasElement: HTMLElement, view: "baseline" | "new") => {
  await userEvent.click(within(canvasElement).getByRole("button", { name: `zoom ${view}` }));

  const dialog = await screen.findByRole("dialog", { name: view });
  const imageName =
    view === "baseline" ? "baseline snapshot of Button Primary" : "snapshot of Button Primary";
  const image = await within(dialog).findByRole("img", { name: imageName });
  await waitFor(() => expect((image as HTMLImageElement).naturalWidth).toBeGreaterThan(0));

  return { dialog, image };
};

export const NoBaseline: Story = {
  play: async ({ canvasElement }) => {
    const { dialog } = await openDialog(canvasElement, "new");
    await expect(within(dialog).queryByRole("tab")).not.toBeInTheDocument();
  },
};

export const Baseline: Story = {
  args: comparisonArgs,
  play: async ({ canvasElement }) => {
    const { dialog } = await openDialog(canvasElement, "baseline");
    await expect(within(dialog).getByRole("tab", { name: "baseline" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(within(dialog).getByRole("switch")).toHaveAttribute("aria-disabled", "true");
  },
};

export const NewWithDiff: Story = {
  args: comparisonArgs,
  play: async ({ canvasElement }) => {
    const { dialog } = await openDialog(canvasElement, "new");
    await expect(within(dialog).getByRole("switch")).toBeChecked();
    await expect(
      within(dialog).getByRole("img", { name: "diff overlay of snapshot of Button Primary" }),
    ).toBeVisible();
  },
};

export const NewWithDiffHidden: Story = {
  parameters: { ovr: { viewports: ["desktop"] } },
  args: comparisonArgs,
  play: async ({ canvasElement }) => {
    const { dialog } = await openDialog(canvasElement, "new");
    const diffImage = within(dialog).getByRole("img", {
      name: "diff overlay of snapshot of Button Primary",
    });

    await userEvent.click(within(dialog).getByRole("switch"));

    await expect(within(dialog).getByRole("switch")).not.toBeChecked();
    await expect(diffImage).not.toBeVisible();
  },
};

export const ToggleToBaseline: Story = {
  parameters: { ovr: { viewports: ["desktop"] } },
  args: comparisonArgs,
  play: async ({ canvasElement }) => {
    const { dialog, image: newImage } = await openDialog(canvasElement, "new");

    await userEvent.click(within(dialog).getByRole("tab", { name: "baseline" }));

    const baselineImage = await within(dialog).findByRole("img", {
      name: "baseline snapshot of Button Primary",
    });
    await expect(screen.getByRole("dialog", { name: "baseline" })).toBeVisible();
    await expect(newImage).not.toBeVisible();
    await expect(baselineImage.getBoundingClientRect().left).toBe(
      newImage.getBoundingClientRect().left,
    );
    await expect(baselineImage.getBoundingClientRect().top).toBe(
      newImage.getBoundingClientRect().top,
    );
  },
};
