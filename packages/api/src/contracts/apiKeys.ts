import { oc } from "@orpc/contract";
import { z } from "zod";

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  peek: z.string().nullable(),
  createdAt: z.date(),
  lastRequest: z.date().nullable(),
});

export const createApiKeyInputSchema = z.object({
  name: z.string().min(1).max(100),
});

export const createApiKeyOutputSchema = z.object({
  key: z.string(),
});

export const listApiKeysInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const listApiKeysOutputSchema = z.object({
  apiKeys: z.array(apiKeySchema),
  total: z.number().int().nonnegative(),
});

export const revokeApiKeyInputSchema = z.object({
  keyId: z.string(),
});

export const contract = {
  create: oc.input(createApiKeyInputSchema).output(createApiKeyOutputSchema),
  list: oc.input(listApiKeysInputSchema).output(listApiKeysOutputSchema),
  revoke: oc.input(revokeApiKeyInputSchema),
} as const;
