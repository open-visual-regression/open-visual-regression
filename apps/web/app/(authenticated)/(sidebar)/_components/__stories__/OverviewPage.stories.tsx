import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import OverviewPage from "../../page";

const meta: Meta<typeof OverviewPage> = {
  title: "Web/OverviewPage",
  component: OverviewPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/" },
    },
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <main className="px-5 py-3 md:px-6 md:py-4 lg:px-10 lg:py-6">
        <Story />
      </main>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OverviewPage>;

export const Default: Story = {};
