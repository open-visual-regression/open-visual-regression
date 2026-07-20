import { Badge } from "@ovr/ui/components/badge";

export type Role = "admin" | "user";

export const toRole = (role: string | null): Role => (role === "admin" ? "admin" : "user");

type RoleBadgeProps = {
  role: Role;
};

export const RoleBadge = ({ role }: RoleBadgeProps) =>
  role === "admin" ? <Badge color="amber">admin</Badge> : <Badge color="neutral">user</Badge>;
