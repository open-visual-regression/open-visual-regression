import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { db } from "@ovr/db/client";
import * as schema from "@ovr/db/schema/auth";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [admin(), apiKey({ defaultPrefix: "ovr_api_key_" }), organization()],
  rateLimit: {
    window: 60,
    max: 100,
  },
  baseURL: process.env.BASE_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.BASE_URL ?? "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
