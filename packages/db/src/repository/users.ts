import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { type PgColumn, unionAll } from "drizzle-orm/pg-core";
import { db } from "../db";
import { invitation, member, user } from "../schemas/auth";

export const getUserCount = async (): Promise<number> => {
  const [row] = await db.select({ count: count() }).from(user);
  return row?.count ?? 0;
};

export const findByEmail = (email: string) =>
  db.query.user.findFirst({ where: eq(user.email, email) });

export const findInvitationById = (id: string) =>
  db.query.invitation.findFirst({ where: eq(invitation.id, id), with: { organization: true } });

export type UsersSortField = "name" | "email" | "createdAt" | "status";

export type SortDirection = "asc" | "desc";

type FindAllUsersInput = {
  organizationId: string;
  search?: string;
  sortBy?: UsersSortField;
  sortDirection?: SortDirection;
  limit: number;
  offset: number;
};

export const findAllUsers = async ({
  organizationId,
  search,
  sortBy = "name",
  sortDirection = "asc",
  limit,
  offset,
}: FindAllUsersInput) => {
  const activeFilter = and(
    eq(member.organizationId, organizationId),
    search ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`)) : undefined,
  );

  const invitedFilter = and(
    eq(invitation.organizationId, organizationId),
    eq(invitation.status, "pending"),
    search ? ilike(invitation.email, `%${search}%`) : undefined,
  );

  const buildSortKey = (column: { name: PgColumn; email: PgColumn; createdAt: PgColumn }) => {
    switch (sortBy) {
      case "email":
        return sql<string>`lower(${column.email})`;
      case "createdAt":
        return sql<string>`${column.createdAt}::text`;
      default:
        return sql<string>`lower(${column.name})`;
    }
  };

  const activeUsers = db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: sql<"active" | "invited">`'active'`.as("status"),
      createdAt: user.createdAt,
      sortKey:
        sortBy === "status"
          ? sql<string>`'active'`.as("sort_key")
          : buildSortKey({ name: user.name, email: user.email, createdAt: user.createdAt }).as(
              "sort_key",
            ),
    })
    .from(user)
    .innerJoin(member, eq(member.userId, user.id))
    .where(activeFilter)
    .groupBy(user.id);

  const invitedUsers = db
    .select({
      id: invitation.id,
      name: invitation.email,
      email: invitation.email,
      role: invitation.role,
      status: sql<"active" | "invited">`'invited'`.as("status"),
      createdAt: invitation.createdAt,
      sortKey:
        sortBy === "status"
          ? sql<string>`'invited'`.as("sort_key")
          : buildSortKey({
              name: invitation.email,
              email: invitation.email,
              createdAt: invitation.createdAt,
            }).as("sort_key"),
    })
    .from(invitation)
    .where(invitedFilter);

  const orderFn = sortDirection === "asc" ? asc : desc;
  const sortKeyColumn = sql.identifier("sort_key");

  const [rows, [activeCount], [invitedCount]] = await Promise.all([
    unionAll(activeUsers, invitedUsers)
      .orderBy(() => orderFn(sortKeyColumn))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(user)
      .innerJoin(member, eq(member.userId, user.id))
      .where(activeFilter),
    db.select({ count: count() }).from(invitation).where(invitedFilter),
  ]);

  return { rows, total: (activeCount?.count ?? 0) + (invitedCount?.count ?? 0) };
};

export type FindAllUsersResult = Awaited<ReturnType<typeof findAllUsers>>;

export type UserDbSchema = FindAllUsersResult["rows"][number];
