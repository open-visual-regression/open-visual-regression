import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { member } from "../schemas/auth";

export const getOrganization = () => db.query.organization.findFirst();

export const findAll = () => db.query.organization.findMany({ columns: { id: true } });

export const findMembership = ({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) =>
  db.query.member.findFirst({
    where: and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    columns: { id: true },
  });
