import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "@storybook/test";

import { Skeleton } from "../skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div className="flex items-end gap-4">{children}</div>
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <Section label="shapes">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-20 w-32" />
      </Section>

      <Section label="image placeholder">
        <Skeleton className="h-40 w-60" />
      </Section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const skeletons = canvasElement.querySelectorAll('[data-slot="skeleton"]');

    expect(skeletons.length).toBeGreaterThan(0);
    for (const skeleton of skeletons) {
      expect(skeleton).toHaveClass("animate-pulse");
    }
  },
};
