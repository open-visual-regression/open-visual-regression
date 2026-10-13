import { asc, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { ssoIdentities } from "../schema";

export const find = ({ issuer, subject }: { issuer: string; subject: string }) =>
  db.query.ssoIdentities.findFirst({
    where: (ssoIdentities, { and, eq }) =>
      and(eq(ssoIdentities.issuer, issuer), eq(ssoIdentities.subject, subject)),
  });

export const findById = (id: string) =>
  db.query.ssoIdentities.findFirst({ where: eq(ssoIdentities.id, id) });

export const findAll = () => db.query.ssoIdentities.findMany({ orderBy: asc(ssoIdentities.email) });

type RecordInput = {
  issuer: string;
  subject: string;
  email: string;
  name: string;
  role: string | null;
};

export const record = async ({ issuer, subject, email, name, role }: RecordInput) => {
  const [row] = await db
    .insert(ssoIdentities)
    .values({ issuer, subject, email, name, role })
    .onConflictDoUpdate({
      target: [ssoIdentities.issuer, ssoIdentities.subject],
      set: { email, name, role, lastSeenAt: sql`now()` },
    })
    .returning();
  return row;
};

export const confirmUser = async ({ id, userId }: { id: string; userId: string }) => {
  await db.update(ssoIdentities).set({ userId }).where(eq(ssoIdentities.id, id));
};

export type SsoIdentityDbSchema = NonNullable<Awaited<ReturnType<typeof find>>>;
