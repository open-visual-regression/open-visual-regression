import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { mocks } from "@ovr/mocks";
import { RecentBuildsSidebarLinks } from "../RecentBuildsSidebarLinks";
import { RECENT_BUILD_ROW_HEIGHT_PX } from "../RecentBuildSidebarLink";

const BUILDS = Array.from({ length: 20 }, (_, i) =>
  mocks.build.generateBuild({ name: `Build ${i + 1}` }),
);

const withFixedHeight = (heightPx: number) => [
  (Story: React.ComponentType) => (
    <div style={{ display: "flex", flexDirection: "column", width: 240, height: heightPx }}>
      <Story />
    </div>
  ),
];

const getVisibleRows = (canvasElement: HTMLElement) =>
  within(canvasElement)
    .queryAllByRole("link")
    .filter((link) => getComputedStyle(link).display !== "none");

// The section heading sits above the row list and eats into the fixed height passed to the
// decorator, so the number of rows that fit is derived from the row container's actual height
// rather than a hand-computed constant (which would be fragile to font/line-height differences).
const getExpectedRowCount = (canvasElement: HTMLElement) => {
  const rowsContainer = within(canvasElement).getByTestId("recent-builds-rows");
  return Math.floor(rowsContainer.getBoundingClientRect().height / RECENT_BUILD_ROW_HEIGHT_PX);
};

const meta: Meta<typeof RecentBuildsSidebarLinks> = {
  title: "Web/RecentBuildsSidebarLinks",
  component: RecentBuildsSidebarLinks,
  tags: ["autodocs"],
  parameters: {
    ovr: {
      viewports: ["desktop"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecentBuildsSidebarLinks>;

// Roughly how much vertical space is left for this section on a typical desktop sidebar.
export const Default: Story = {
  args: { builds: BUILDS },
  decorators: withFixedHeight(400),
  play: async ({ canvasElement }) => {
    await expect(getVisibleRows(canvasElement)).toHaveLength(getExpectedRowCount(canvasElement));
  },
};

export const ExactMultipleOfRowHeight: Story = {
  args: { builds: BUILDS },
  decorators: withFixedHeight(220),
  play: async ({ canvasElement }) => {
    const expected = getExpectedRowCount(canvasElement);
    await expect(getVisibleRows(canvasElement)).toHaveLength(expected);
    expect(expected).toBeGreaterThan(0);
  },
};

export const PartialRemainderIsNeverShown: Story = {
  args: { builds: BUILDS },
  decorators: withFixedHeight(200),
  play: async ({ canvasElement }) => {
    // Whatever space is left over after the last full row is not enough for another one, so it's
    // hidden entirely rather than clipped mid-row.
    await expect(getVisibleRows(canvasElement)).toHaveLength(getExpectedRowCount(canvasElement));
  },
};

export const NotEnoughSpaceForAnyRow: Story = {
  args: { builds: BUILDS },
  decorators: withFixedHeight(20),
  play: async ({ canvasElement }) => {
    await expect(getVisibleRows(canvasElement)).toHaveLength(0);
  },
};

export const NoBuilds: Story = {
  args: { builds: [] },
  decorators: withFixedHeight(400),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("heading")).not.toBeInTheDocument();
  },
};
