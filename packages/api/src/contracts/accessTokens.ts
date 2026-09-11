import { oc } from "@orpc/contract";
import { z } from "zod";

export const ACCESS_TOKEN_NAME_MAX_LENGTH = 32;

export const ACCESS_TOKEN_PERMISSIONS: Record<string, string[]> = { builds: ["read"] };

export const tokenPermissionsSchema = z.record(z.string(), z.array(z.string()));

export type TokenPermissions = z.infer<typeof tokenPermissionsSchema>;

export const accessTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  lastRequest: z.date().nullable(),
});

export type AccessTokenSchema = z.infer<typeof accessTokenSchema>;

export const createAccessTokenInputSchema = z.object({
  name: z.string().min(1).max(ACCESS_TOKEN_NAME_MAX_LENGTH),
});

export const createAccessTokenOutputSchema = z.object({
  token: z.string(),
});

export const listAccessTokensInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const listAccessTokensOutputSchema = z.object({
  accessTokens: z.array(accessTokenSchema),
  total: z.number().int().nonnegative(),
});

export const revokeAccessTokenInputSchema = z.object({
  tokenId: z.string(),
});

export const contract = {
  create: oc.input(createAccessTokenInputSchema).output(createAccessTokenOutputSchema),
  list: oc.input(listAccessTokensInputSchema).output(listAccessTokensOutputSchema),
  revoke: oc.input(revokeAccessTokenInputSchema),
} as const;
