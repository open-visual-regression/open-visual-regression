import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mocks } from "@ovr/mocks";

import { SnapshotCard, SnapshotCardSkeleton } from "../SnapshotCard";

const meta: Meta<typeof SnapshotCard> = {
  title: "Web/SnapshotCard",
  component: SnapshotCard,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/projects/project-1/builds/build-1" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapshotCard>;

const snapshot = (overrides: Parameters<typeof mocks.build.generateBuildSnapshot>[0]) =>
  mocks.build.generateBuildSnapshot({
    buildId: "build-1",
    project: { id: "project-1", name: "Storefront" },
    targetName: "Primary",
    targetTitle: "Button",
    imagePath: "new-desktop.png",
    status: "unchanged",
    browser: "chromium",
    viewportWidth: 1280,
    viewportName: "desktop",
    ...overrides,
  });

const Variant = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <p className="font-mono text-[11px] text-muted-foreground">{label}</p>
    {children}
  </div>
);

export const KitchenSink: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 p-6">
      <Variant label="default">
        <SnapshotCard snapshot={snapshot({ id: "snapshot-1" })} />
      </Variant>
      <Variant label="needs review">
        <SnapshotCard
          snapshot={snapshot({
            id: "snapshot-2",
            targetName: "Hero",
            targetTitle: "Banner",
            imagePath: "diff-desktop.png",
            status: "needs_review",
            browser: "firefox",
            viewportWidth: 375,
            viewportName: "mobile",
          })}
        />
      </Variant>
      <Variant label="no preview">
        <SnapshotCard
          snapshot={snapshot({
            id: "snapshot-3",
            targetName: "Footer",
            targetTitle: "Layout",
            imagePath: "",
            status: "queued",
          })}
        />
      </Variant>
      <Variant label="warning">
        <SnapshotCard snapshot={snapshot({ id: "snapshot-4", hasUncaughtPageError: true })} />
      </Variant>
      <Variant label="flaky">
        <SnapshotCard
          snapshot={snapshot({ id: "snapshot-5", status: "needs_review", isFlaky: true })}
        />
      </Variant>
      <Variant label="processing time">
        <SnapshotCard snapshot={snapshot({ id: "snapshot-6", processingMs: 2500 })} />
      </Variant>
      <Variant label="with project">
        <SnapshotCard snapshot={snapshot({ id: "snapshot-7" })} showProject />
      </Variant>
      <Variant label="with a long project name">
        <SnapshotCard
          snapshot={snapshot({
            id: "snapshot-8",
            project: {
              id: "project-2",
              name: "Customer Self-Service Portal for Enterprise Accounts (Legacy Billing and Invoicing Migration)",
            },
          })}
          showProject
        />
      </Variant>
      <Variant label="skeleton, with project">
        <SnapshotCardSkeleton showProject />
      </Variant>
    </div>
  ),
};
