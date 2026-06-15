import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { invitation } from "../schemas/auth";

export const findPending = (organizationId: string) =>
  db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      createdAt: invitation.createdAt,
    })
    .from(invitation)
    .where(and(eq(invitation.organizationId, organizationId), eq(invitation.status, "pending")))
    .orderBy(desc(invitation.createdAt));

export type FindPendingResult = Awaited<ReturnType<typeof findPending>>;

export type InvitationDbSchema = FindPendingResult[number];
