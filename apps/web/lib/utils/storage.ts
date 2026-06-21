export const getStoragePath = (path: string | null) => (path ? `/api/storage/${path}` : null);
