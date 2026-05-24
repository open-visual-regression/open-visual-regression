import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "../spinner";

const meta: Meta<typeof Spinner> = {
  title: "UI/Spinner",
  component: Spinner,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Spinner>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div className="flex items-end gap-4">{children}</div>
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <Section label="sizes">
        <Spinner className="size-3" />
        <Spinner className="size-4" />
        <Spinner className="size-5" />
        <Spinner className="size-6" />
        <Spinner className="size-8" />
      </Section>

      <Section label="in context">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner />
          <span>Capturing snapshots…</span>
        </div>
      </Section>

      <Section label="muted foreground color">
        <Spinner className="text-muted-foreground" />
      </Section>
    </div>
  ),
};
