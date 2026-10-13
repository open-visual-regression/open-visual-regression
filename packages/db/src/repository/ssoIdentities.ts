import { sql } from "drizzle-orm";

import { db } from "../db";
import { ssoIdentities } from "../schema";

export const find = ({ issuer, subject }: { issuer: string; subject: string }) =>
  db.query.ssoIdentities.findFirst({
    where: (ssoIdentities, { and, eq }) =>
      and(eq(ssoIdentities.issuer, issuer), eq(ssoIdentities.subject, subject)),
  });

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

export type SsoIdentityDbSchema = NonNullable<Awaited<ReturnType<typeof find>>>;
