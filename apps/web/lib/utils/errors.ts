"server only";

export function serverError(message?: string): never {
  throw new Error(message ?? "An unexpected server error occurred");
}
