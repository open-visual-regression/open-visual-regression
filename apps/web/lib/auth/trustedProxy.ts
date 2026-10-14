import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import { z } from "zod";

import { dbClient } from "@ovr/db/client";

import { getForbiddenPath, getSafeRedirectPath } from "@/lib/utils/redirects";

import { getAuthConfig } from "./config";
import { resolveRole, verifyProxyToken } from "./proxyToken";

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
            throw ctx.redirect(getForbiddenPath("unverified"));
          }

          const role = resolveRole(identity.groups, config.roleGroups);

          if (!role) {
            throw ctx.redirect(getForbiddenPath("no-role"));
          }

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
          const organization = await dbClient.organizations.getOrganization();

          if (organization) {
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
                  role: "member",
                  createdAt: new Date(),
                },
              });
            }
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
