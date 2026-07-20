export type Role = "admin" | "user";

export const toRole = (role: string | null): Role => (role === "admin" ? "admin" : "user");
