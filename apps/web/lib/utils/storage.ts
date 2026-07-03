export const getStoragePath = (path: string | null) => (path ? `/api/storage/${path}` : null);

export const getStorybookPath = (buildId: string) => `/api/storybook/${buildId}/index.html`;
