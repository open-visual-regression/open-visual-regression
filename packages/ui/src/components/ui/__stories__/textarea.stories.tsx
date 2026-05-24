import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "../textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-6 p-6 max-w-xs">
      <Section label="default (empty)">
        <Textarea />
      </Section>

      <Section label="placeholder">
        <Textarea placeholder="Describe the visual change…" />
      </Section>

      <Section label="with value">
        <Textarea defaultValue="Navbar height reduced from 64px to 48px. Verified on Chrome 120 and Firefox 121." />
      </Section>

      <Section label="disabled">
        <Textarea
          disabled
          defaultValue="Approved by ci-bot on 2026-05-24."
        />
      </Section>

      <Section label="invalid">
        <Textarea
          aria-invalid="true"
          placeholder="Comment is required to reject a run."
        />
      </Section>
    </div>
  ),
};
