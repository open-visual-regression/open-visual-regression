import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "../Logo";

const meta: Meta<typeof Logo> = {
  title: "Web/Logo",
  component: Logo,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Logo>;

const Surface = ({
  label,
  bg,
  children,
}: {
  label: string;
  bg: string;
  children: React.ReactNode;
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <div
      style={{
        width: 160,
        height: 80,
        background: bg,
        border: "1px solid var(--ovr-border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
    <span
      style={{
        fontSize: 10,
        color: "var(--ovr-fg-tertiary)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  </div>
);

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        padding: 24,
        background: "var(--ovr-bg-base)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <Logo size="sm" />
        <span
          style={{
            fontSize: 10,
            color: "var(--ovr-fg-tertiary)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          sm — topbar
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <Logo size="lg" />
        <span
          style={{
            fontSize: 10,
            color: "var(--ovr-fg-tertiary)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          lg — display
        </span>
      </div>
    </div>
  ),
};

export const MarkOnly: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: 24,
        background: "var(--ovr-bg-base)",
      }}
    >
      <Logo size="sm" wordmark={false} />
      <Logo size="lg" wordmark={false} />
    </div>
  ),
};

export const Surfaces: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 0, padding: 24, background: "var(--ovr-bg-base)" }}>
      <Surface label="on base" bg="var(--ovr-bg-base)">
        <Logo size="lg" />
      </Surface>
      <Surface label="on elevated" bg="var(--ovr-bg-elevated)">
        <Logo size="lg" />
      </Surface>
      <Surface label="on light" bg="#fafafa">
        <Logo size="lg" />
      </Surface>
      <Surface label="on accent" bg="var(--ovr-accent-primary)">
        <Logo size="lg" onAccent />
      </Surface>
    </div>
  ),
};
