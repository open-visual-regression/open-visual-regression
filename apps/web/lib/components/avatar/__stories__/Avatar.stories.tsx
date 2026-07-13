import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar } from "../Avatar";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#6366f1"/><circle cx="32" cy="24" r="12" fill="#fff"/><rect x="12" y="42" width="40" height="20" rx="10" fill="#fff"/></svg>',
  );

const meta: Meta<typeof Avatar> = {
  title: "Web/Avatar",
  component: Avatar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <p className="text-label tracking-label uppercase text-ovr-fg-tertiary">{label}</p>
    {children}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="space-y-8 p-6 bg-background">
      <Section label="monogram fallback">
        <div className="flex items-center gap-3">
          <Avatar name="Ada Lovelace" />
          <Avatar name="Alan Turing" />
          <Avatar name="Grace Hopper" />
        </div>
      </Section>

      <Section label="image">
        <Avatar name="Ada Lovelace" image={PLACEHOLDER_IMAGE} />
      </Section>
    </div>
  ),
};
