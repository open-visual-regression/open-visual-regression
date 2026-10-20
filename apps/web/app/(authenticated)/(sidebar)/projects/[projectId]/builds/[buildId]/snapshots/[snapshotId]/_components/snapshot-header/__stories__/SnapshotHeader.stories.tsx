import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { BuildSchema } from "@ovr/api/contracts/builds";
import type { SnapshotSchema } from "@ovr/api/contracts/snapshots";
import { mocks } from "@ovr/mocks";

import { SnapshotHeader } from "../SnapshotHeader";

const meta: Meta<typeof SnapshotHeader> = {
  title: "Web/SnapshotHeader",
  component: SnapshotHeader,
  tags: ["autodocs"],
  args: {
    storybookHref:
      "/api/storybook/mock-build/index.html?path=/story/web-skeletons-projectheaderskeleton--default",
  },
  parameters: {
    ovr: {
      viewports: ["desktop", "tablet", "mobile"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapshotHeader>;

const snapshot: SnapshotSchema = {
  id: "019edfc7-e040-7492-86b2-ccfdc00cf6e2",
  browser: "chromium",
  viewportWidth: 1280,
  viewportHeight: 800,
  viewportName: "desktop",
  targetId: "web-skeletons-projectheaderskeleton--default",
  targetName: "Default",
  targetTitle: "Web/Skeletons/ProjectHeaderSkeleton",
  imagePath: "new.png",
  status: "unchanged",
  errorMessage: null,
  hasUncaughtPageError: false,
  isFlaky: false,
  flags: [],
  isRebuildable: false,
  isReviewable: true,
  errorLogs: [],
  queuedMs: 12_000,
  processingMs: 3_400,
};

const buildOverrides: Partial<BuildSchema> = {
  name: "Add empty state to projects table",
  commitSha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
  author: "Jordan Lee",
  createdAt: "2026-06-20T12:00:00.000Z",
};

export const Unchanged: Story = {
  args: {
    snapshot: { ...snapshot, status: "unchanged" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const AutoApproved: Story = {
  args: {
    snapshot: { ...snapshot, status: "auto_approved" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const NeedsReview: Story = {
  args: {
    snapshot: { ...snapshot, status: "needs_review" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const Flaky: Story = {
  args: {
    snapshot: {
      ...snapshot,
      status: "needs_review",
      isFlaky: true,
    },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const Processing: Story = {
  args: {
    snapshot: { ...snapshot, status: "processing", processingMs: null },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const Rejected: Story = {
  args: {
    snapshot: { ...snapshot, status: "rejected" },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const Errored: Story = {
  args: {
    snapshot: {
      ...snapshot,
      status: "error",
      errorMessage: "Cannot read properties of undefined (reading 'items')",
    },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const ErroredWithLongMessage: Story = {
  args: {
    snapshot: {
      ...snapshot,
      status: "error",
      errorMessage: `TypeError: Cannot read properties of undefined (reading 'items') at ProjectsTable (webpack-internal:///./src/components/projects-table/ProjectsTable.tsx:42:31) at renderWithHooks (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:16305:18) at mountIndeterminateComponent (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:20074:13) at beginWork (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:21587:16) at HTMLUnknownElement.callCallback (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:4164:14) at Object.invokeGuardedCallbackDev (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:4213:16) at invokeGuardedCallback (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:4277:31) at beginWork$1 (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:27451:7) at performUnitOfWork (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:26557:12) at workLoopSync (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:26466:5)`,
    },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const UncaughtPageError: Story = {
  args: {
    snapshot: { ...snapshot, status: "unchanged", hasUncaughtPageError: true },
    build: mocks.build.generateBuild(buildOverrides),
  },
};

export const NoStorybook: Story = {
  args: {
    snapshot,
    build: mocks.build.generateBuild(buildOverrides),
    storybookHref: null,
  },
};
