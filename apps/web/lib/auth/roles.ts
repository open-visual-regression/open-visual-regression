export const ROLES = ["admin", "reviewer", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = "reviewer";

export const toRole = (role: string | null | undefined): Role =>
  role === "admin" ? "admin" : role === "viewer" ? "viewer" : "reviewer";

export const canReview = (role: string | null | undefined): boolean => toRole(role) !== "viewer";
