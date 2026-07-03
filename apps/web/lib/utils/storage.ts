export const getStoragePath = (path: string | null) => (path ? `/api/storage/${path}` : null);

export const getStorybookPath = (projectId: string, buildId: string) =>
  `/api/projects/${projectId}/builds/${buildId}/storybook/index.html`;

export const getStorybookStaticKey = (projectId: string, buildId: string, relativePath: string) =>
  `${projectId}/${buildId}/storybook/${relativePath}`;
