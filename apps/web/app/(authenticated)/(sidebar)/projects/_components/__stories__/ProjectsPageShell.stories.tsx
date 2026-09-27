import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlusIcon } from "@ovr/ui/components/icon";
import { Typography } from "@ovr/ui/components/typography";

import { ResponsiveActionButton } from "@/lib/components/responsive-action-button/ResponsiveActionButton";

import { ProjectsPageShell } from "../ProjectsPageShell";

const meta: Meta<typeof ProjectsPageShell> = {
  title: "Web/ProjectsPageShell",
  component: ProjectsPageShell,
  tags: ["autodocs"],
  args: {
    heading: (
      <div className="flex flex-row gap-2 items-end-safe">
        <Typography variant="h1" as="h1">
          projects
        </Typography>
        <Typography variant="h2" className="text-muted-foreground" as="p">
          (12)
        </Typography>
      </div>
    ),
    action: (
      <ResponsiveActionButton href="/projects/new" icon={PlusIcon}>
        new project
      </ResponsiveActionButton>
    ),
    content: <div className="h-24 rounded-md border border-dashed" />,
  },
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectsPageShell>;

export const Default: Story = {};
