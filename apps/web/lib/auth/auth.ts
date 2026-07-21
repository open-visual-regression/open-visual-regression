"server only";

import { apiKey } from "@better-auth/api-key";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import * as schema from "@ovr/db/schema";

const ac = createAccessControl(defaultStatements);

const roles = {
  admin: ac.newRole(adminAc.statements),
  reviewer: ac.newRole(userAc.statements),
  viewer: ac.newRole(userAc.statements),
};

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    admin({ ac, roles, defaultRole: "reviewer" }),
    apiKey({
      defaultPrefix: "ovr_api_key_",
      enableMetadata: true,
      rateLimit: { enabled: false },
    }),
    organization(),
    nextCookies(),
  ],
  rateLimit: {
    window: 60,
    max: 100,
  },
  baseURL: process.env.BASE_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.BASE_URL ?? "http://localhost:3000"],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const organization = await dbClient.organizations.getOrganization();
          return { data: { ...session, activeOrganizationId: organization?.id } };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
