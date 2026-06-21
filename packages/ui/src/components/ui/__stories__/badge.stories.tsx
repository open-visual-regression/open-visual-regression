import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../badge";
import type { BadgeVariant } from "../badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Badge>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const VARIANTS: BadgeVariant[] = [
  "pass",
  "fail",
  "rejected",
  "pending",
  "stale",
  "changed",
  "neutral",
];

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      {VARIANTS.map((variant) => (
        <Section key={variant} label={`variant="${variant}"`}>
          <Badge variant={variant}>{variant}</Badge>
          <Badge variant={variant} filled>
            {variant}
          </Badge>
        </Section>
      ))}
    </div>
  ),
};
