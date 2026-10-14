import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import { z } from "zod";

import { dbClient } from "@ovr/db/client";
import { createLogger } from "@ovr/logger";

import { FORBIDDEN_PATH, getSafeRedirectPath } from "@/lib/utils/redirects";
import { toSlug } from "@/lib/utils/slug";

import { getAuthConfig } from "./config";
import { resolveRole, verifyProxyToken } from "./proxyToken";

const logger = createLogger("auth");

export const TRUSTED_PROXY_PROVIDER_ID = "trusted-proxy";

export const TRUSTED_PROXY_SIGN_IN_PATH = "/api/auth/sign-in/trusted-proxy";

export const trustedProxy = () =>
  ({
    id: "trusted-proxy",
    rateLimit: [
      {
        pathMatcher: (path) => path === "/sign-in/trusted-proxy",
        window: 60,
        max: 100,
      },
    ],
    endpoints: {
      signInTrustedProxy: createAuthEndpoint(
        "/sign-in/trusted-proxy",
        {
          method: "GET",
          query: z.object({ callbackURL: z.string().optional() }),
          requireHeaders: true,
        },
        async (ctx) => {
          const config = getAuthConfig();

          if (config.mode !== "trusted-proxy") {
            throw new APIError("NOT_FOUND");
          }

          const [error, identity] = await verifyProxyToken(ctx.headers, config);

          if (error || !identity) {
            logger.warn(
              { err: error },
              "refused sign-in: the proxy identity could not be verified",
            );
            throw ctx.redirect(FORBIDDEN_PATH);
          }

          const role = resolveRole(identity.groups, config.roleGroups);

          if (!role) {
            logger.warn(
              { email: identity.email, groups: identity.groups },
              "refused sign-in: no group grants a role",
            );
            throw ctx.redirect(FORBIDDEN_PATH);
          }

          const existingOrganization = await dbClient.organizations.getOrganization();

          if (!existingOrganization && role !== "admin") {
            logger.warn(
              { email: identity.email, role },
              "refused sign-in: OVR has not been set up by an admin yet",
            );
            throw ctx.redirect(FORBIDDEN_PATH);
          }

          const organization =
            existingOrganization ??
            (await ctx.context.adapter.create<{ id: string }>({
              model: "organization",
              data: {
                name: config.organizationName,
                slug: toSlug(config.organizationName),
                createdAt: new Date(),
              },
            }));

          const result = await handleOAuthUserInfo(ctx, {
            userInfo: {
              id: identity.subject,
              email: identity.email,
              name: identity.name,
              emailVerified: true,
            },
            account: {
              providerId: TRUSTED_PROXY_PROVIDER_ID,
              issuer: identity.issuer,
              accountId: identity.subject,
            },
            source: { method: "oauth", oauth: { providerId: TRUSTED_PROXY_PROVIDER_ID } },
          });

          if (result.error || !result.data) {
            throw new APIError("INTERNAL_SERVER_ERROR", { message: result.error ?? undefined });
          }

          const { session, user } = result.data;
          const membership = await dbClient.organizations.findMembership({
            userId: user.id,
            organizationId: organization.id,
          });

          if (!membership) {
            await ctx.context.adapter.create({
              model: "member",
              data: {
                organizationId: organization.id,
                userId: user.id,
                role: existingOrganization ? "member" : "owner",
                createdAt: new Date(),
              },
            });
          }

          await setSessionCookie(ctx, {
            session,
            user: await ctx.context.internalAdapter.updateUser(user.id, { role }),
          });

          throw ctx.redirect(getSafeRedirectPath(ctx.query.callbackURL));
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
