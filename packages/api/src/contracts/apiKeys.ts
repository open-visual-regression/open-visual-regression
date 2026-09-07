import { oc } from "@orpc/contract";
import { z } from "zod";

export const API_KEY_NAME_MAX_LENGTH = 32;

export const apiKeyPresetSchema = z.enum(["ci_upload", "agent_read", "agent_review"]);

export type ApiKeyPresetSchema = z.infer<typeof apiKeyPresetSchema>;

export const apiKeyPermissionsSchema = z.record(z.string(), z.array(z.string()));

export type ApiKeyPermissions = z.infer<typeof apiKeyPermissionsSchema>;

export const API_KEY_PRESET_PERMISSIONS: Record<ApiKeyPresetSchema, ApiKeyPermissions> = {
  ci_upload: { builds: ["write"] },
  agent_read: { builds: ["read"] },
  agent_review: { builds: ["read"], reviews: ["write"] },
};

const canonicalPermissions = (permissions: ApiKeyPermissions): string =>
  JSON.stringify(
    Object.keys(permissions)
      .sort()
      .map((resource) => [resource, [...permissions[resource]!].sort()]),
  );

export const parseApiKeyPermissions = (raw: string): ApiKeyPermissions | null => {
  try {
    return apiKeyPermissionsSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const toApiKeyPreset = (
  permissions: ApiKeyPermissions | null,
): ApiKeyPresetSchema | null => {
  if (!permissions) {
    return null;
  }

  const canonical = canonicalPermissions(permissions);

  return (
    apiKeyPresetSchema.options.find(
      (preset) => canonicalPermissions(API_KEY_PRESET_PERMISSIONS[preset]) === canonical,
    ) ?? null
  );
};

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerName: z.string(),
  preset: apiKeyPresetSchema.nullable(),
  createdAt: z.date(),
  lastRequest: z.date().nullable(),
});

export type ApiKeySchema = z.infer<typeof apiKeySchema>;

export const createApiKeyInputSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(API_KEY_NAME_MAX_LENGTH),
  preset: apiKeyPresetSchema.default("ci_upload"),
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
