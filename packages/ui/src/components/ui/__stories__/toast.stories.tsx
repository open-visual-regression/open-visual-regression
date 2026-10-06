import type { Meta, StoryObj } from "@storybook/react-vite";

import { Toaster } from "../sonner";
import { Toast, toast } from "../toast";

const meta: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen min-h-[480px]">
        <Story />
        <Toaster expand duration={Infinity} />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => <></>,
  play: () => {
    toast.dismissAll();
    toast.success("Run approved", { description: "All snapshots accepted." });
    toast.error("Regression detected", {
      description: "Visual diffs exceed threshold on feature/navbar.",
      actionLabel: "Review",
      onAction: () => {},
    });
  },
};
