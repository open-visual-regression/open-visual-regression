import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { NewProjectButton } from "../new-project-button/NewProjectButton";
import { ProjectCardsList } from "../ProjectCardsList";
import { ProjectsHeading } from "../ProjectsHeading";
import { ProjectsPageShell } from "../ProjectsPageShell";

const meta: Meta<typeof ProjectsPageShell> = {
  title: "Web/ProjectsPageShell",
  component: ProjectsPageShell,
  tags: ["autodocs"],
  args: {
    heading: <ProjectsHeading total={3} />,
    action: <NewProjectButton role="admin" />,
    content: (
      <ProjectCardsList
        projects={[
          mocks.project.generateProject({
            name: "storefront",
            description: "the main customer-facing storefront",
          }),
          mocks.project.generateProject({
            name: "internal-tools",
            description: "internal admin dashboard",
          }),
          mocks.project.generateProject({ name: "marketing-site", description: null }),
        ]}
        isLoading={false}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={() => {}}
      />
    ),
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects" },
    },
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectsPageShell>;

export const Default: Story = {};
