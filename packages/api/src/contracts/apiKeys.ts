import { oc } from "@orpc/contract";
import { z } from "zod";

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerName: z.string(),
  createdAt: z.date(),
  lastRequest: z.date().nullable(),
});

export type ApiKeySchema = z.infer<typeof apiKeySchema>;

export const createApiKeyInputSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(32),
});

export const createApiKeyOutputSchema = z.object({
  key: z.string(),
});

export const listApiKeysInputSchema = z.object({
  projectId: z.string(),
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
