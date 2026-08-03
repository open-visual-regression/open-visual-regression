import type { Meta, StoryObj } from "@storybook/react-vite";
import type { VariantProps } from "class-variance-authority";

import { Badge, BadgeSkeleton, badgeVariants } from "../badge";

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

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
type BadgeColor = NonNullable<VariantProps<typeof badgeVariants>["color"]>;

const VARIANTS: BadgeVariant[] = ["solid", "outline"];
const COLORS: BadgeColor[] = [
  "accent",
  "red",
  "green",
  "blue",
  "amber",
  "gray",
  "purple",
  "neutral",
];

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      {VARIANTS.map((variant) => (
        <Section key={variant} label={`variant="${variant}"`}>
          {COLORS.map((color) => (
            <Badge key={color} variant={variant} color={color}>
              {color}
            </Badge>
          ))}
        </Section>
      ))}
    </div>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      <Section label="badge vs skeleton">
        <Badge>neutral</Badge>
        <BadgeSkeleton className="w-16" />
      </Section>
      <Section label="widths">
        <BadgeSkeleton className="w-10" />
        <BadgeSkeleton className="w-16" />
        <BadgeSkeleton className="w-24" />
      </Section>
    </div>
  ),
};
