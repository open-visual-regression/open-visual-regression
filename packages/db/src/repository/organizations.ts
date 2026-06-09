import { db } from "../db";

export const getOrganization = () => db.query.organization.findFirst();
