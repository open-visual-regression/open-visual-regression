import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, screen, userEvent, waitFor, within } from "storybook/test";

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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const settle = async (element: Element) => {
  const position = () => {
    const { x, y, width } = element.getBoundingClientRect();
    return `${x},${y},${width}`;
  };
  const isStable = async (previous: string): Promise<void> => {
    await wait(100);
    if (position() !== previous) {
      return isStable(position());
    }
  };
  await isStable(position());
};

const openDialog = async (canvasElement: HTMLElement) => {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "zoom new" }));

  const dialog = await screen.findByRole("dialog", { name: "new" });
  const image = await within(dialog).findByRole("img", { name: "snapshot of Button Primary" });
  // The dialog fits the view once every image has loaded, including the diff overlay.
  await waitFor(() =>
    expect(
      within(dialog)
        .getAllByRole("img")
        .every((element) => (element as HTMLImageElement).naturalWidth > 0),
    ).toBe(true),
  );
  await settle(image);

  return { dialog, image };
};

const drag = async (
  target: Element,
  from: { x: number; y: number },
  by: { x: number; y: number },
) => {
  const mouse = (x: number, y: number, buttons: number) => ({
    clientX: x,
    clientY: y,
    button: 0,
    buttons,
  });

  fireEvent.mouseDown(target, mouse(from.x, from.y, 1));
  await wait(50);
  fireEvent.mouseMove(target, mouse(from.x + by.x / 2, from.y + by.y / 2, 1));
  await wait(50);
  fireEvent.mouseMove(target, mouse(from.x + by.x, from.y + by.y, 1));
  await wait(300);
  // Hold still before releasing: react-zoom-pan-pinch derives release momentum from the
  // last move's wall-clock speed, so a zero-distance move keeps the final position deterministic.
  fireEvent.mouseMove(target, mouse(from.x + by.x, from.y + by.y, 1));
  fireEvent.mouseUp(target, mouse(from.x + by.x, from.y + by.y, 0));
};

const zoomAndPan = async (canvasElement: HTMLElement) => {
  const { dialog, image } = await openDialog(canvasElement);
  const readout = within(dialog).getByRole("status");

  // Each zoom step builds on the in-flight scale, so let one finish before starting the next.
  const zoomIn = async () => {
    const previousReadout = readout.textContent;
    await userEvent.click(within(dialog).getByRole("button", { name: "zoom in" }));
    await waitFor(() => expect(readout.textContent).not.toBe(previousReadout));
    await settle(image);
  };

  await zoomIn();
  await zoomIn();

  const { x, y } = image.getBoundingClientRect();
  await drag(image, { x: x + 200, y: y + 200 }, { x: 150, y: 0 });
  await settle(image);
  await expect(image.getBoundingClientRect().x).toBeGreaterThan(x + 100);
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

export const NoDiffZoomedAndPanned: Story = {
  parameters: { ovr: { viewports: ["desktop"] } },
  play: async ({ canvasElement }) => {
    await zoomAndPan(canvasElement);
  },
};

export const WithDiffZoomedAndPanned: Story = {
  parameters: { ovr: { viewports: ["desktop"] } },
  args: diffArgs,
  play: async ({ canvasElement }) => {
    await zoomAndPan(canvasElement);
  },
};
