import { db } from "../db";

export const getOrganization = () => db.query.organization.findFirst();

export const findAll = () => db.query.organization.findMany({ columns: { id: true } });
