import type { Meta, StoryObj } from "@storybook/react-vite";

import { Typography, TypographySkeleton } from "../typography";

const meta: Meta<typeof Typography> = {
  title: "UI/Typography",
  component: Typography,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Typography>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    <div>{children}</div>
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <Section label='variant="display"'>
        <Typography variant="display" as="h1">
          open visual regression
        </Typography>
      </Section>

      <Section label='variant="h1"'>
        <Typography variant="h1" as="h1">
          open visual regression
        </Typography>
      </Section>

      <Section label='variant="h2"'>
        <Typography variant="h2" as="h2">
          open visual regression
        </Typography>
      </Section>

      <Section label='variant="h3"'>
        <Typography variant="h3" as="h3">
          open visual regression
        </Typography>
      </Section>

      <Section label='variant="body"'>
        <Typography variant="body" as="p">
          Pixel-level visual regression for your CI pipeline. Compare screenshots automatically and
          catch unintended changes before they reach production.
        </Typography>
      </Section>

      <Section label='variant="body-sm"'>
        <Typography variant="body-sm" as="p">
          Pixel-level visual regression for your CI pipeline. Compare screenshots automatically and
          catch unintended changes before they reach production.
        </Typography>
      </Section>

      <Section label='variant="caption"'>
        <Typography variant="caption" as="span">
          Last run 3 minutes ago · 14 diffs detected · branch main
        </Typography>
      </Section>

      <Section label='variant="label"'>
        <Typography variant="label" as="span">
          baseline
        </Typography>
      </Section>

      <Section label='variant="code"'>
        <Typography variant="code" as="code">
          ovr run --branch main --threshold 0.01
        </Typography>
      </Section>

      <Section label='variant="num"'>
        <Typography variant="num" as="span">
          1,024 · 98.6% · 14Δ
        </Typography>
      </Section>
    </div>
  ),
};

const VARIANTS = [
  "display",
  "h1",
  "h2",
  "h3",
  "body",
  "body-sm",
  "caption",
  "label",
  "code",
] as const;

export const Skeletons: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      {VARIANTS.map((variant) => (
        <Section key={variant} label={`variant="${variant}"`}>
          <div className="flex flex-col gap-1">
            <Typography variant={variant}>open visual regression</Typography>
            <TypographySkeleton variant={variant} className="w-56" />
          </div>
        </Section>
      ))}
    </div>
  ),
};
