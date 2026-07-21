import type { BuildStatus, BuildType } from "@ovr/api/contracts/builds";

export const getStoragePath = (path: string | null) => (path ? `/api/storage/${path}` : null);

export const getStorybookPath = (buildId: string) => `/api/storybook/${buildId}/index.html`;

export const getStorybookStoryPath = (buildId: string, storyId: string) =>
  `${getStorybookPath(buildId)}?path=/story/${encodeURIComponent(storyId)}`;

/**
 * Whether a build has a servable Storybook bundle. A non-storybook build (e.g. a
 * future raw-image upload) never does, and the bundle only exists once the build
 * has finished processing without erroring.
 */
export const hasHostedStorybook = (build: { buildType: BuildType; status: BuildStatus }) =>
  build.buildType === "storybook" &&
  build.status !== "queued" &&
  build.status !== "processing" &&
  build.status !== "error";
