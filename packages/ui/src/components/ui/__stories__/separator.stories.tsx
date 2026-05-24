import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "../separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Separator>;

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 max-w-sm">
      <Section label='orientation="horizontal" (default)'>
        <div className="flex flex-col gap-2 text-xs">
          <span>Snapshots captured: 142</span>
          <Separator />
          <span>Regressions detected: 0</span>
          <Separator />
          <span>Threshold: 0.01%</span>
        </div>
      </Section>

      <Section label='orientation="vertical"'>
        <div className="flex h-6 items-center gap-3 text-xs">
          <span>main</span>
          <Separator orientation="vertical" />
          <span>run #42</span>
          <Separator orientation="vertical" />
          <span>142 snapshots</span>
        </div>
      </Section>
    </div>
  ),
};
