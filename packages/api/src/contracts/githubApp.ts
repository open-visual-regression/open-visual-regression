import { oc } from "@orpc/contract";
import { z } from "zod";

export const githubAppInstallationSchema = z.object({
  id: z.number().int(),
  accountLogin: z.string().nullable(),
  accountType: z.string().nullable(),
  htmlUrl: z.string(),
  repositorySelection: z.enum(["all", "selected"]),
  repositoryCount: z.number().int().nullable(),
  suspended: z.boolean(),
});

export type GithubAppInstallationSchema = z.infer<typeof githubAppInstallationSchema>;

export const githubAppSchema = z.object({
  name: z.string(),
  htmlUrl: z.string(),
  installUrl: z.string(),
  ownerLogin: z.string().nullable(),
  permissions: z.record(z.string(), z.string()),
});

export type GithubAppSchema = z.infer<typeof githubAppSchema>;

export const githubAppStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not_configured") }),
  z.object({ status: z.literal("error"), error: z.string() }),
  z.object({
    status: z.literal("ok"),
    app: githubAppSchema,
    installations: z.array(githubAppInstallationSchema),
  }),
]);

export type GithubAppStatusSchema = z.infer<typeof githubAppStatusSchema>;

export const githubAppRepositorySchema = z.object({
  installationId: z.number().int(),
  accountLogin: z.string().nullable(),
  id: z.number().int(),
  fullName: z.string(),
  private: z.boolean(),
});

export type GithubAppRepositorySchema = z.infer<typeof githubAppRepositorySchema>;

export const githubAppRepositoriesSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not_configured") }),
  z.object({ status: z.literal("error"), error: z.string() }),
  z.object({ status: z.literal("ok"), repositories: z.array(githubAppRepositorySchema) }),
]);

export type GithubAppRepositoriesSchema = z.infer<typeof githubAppRepositoriesSchema>;

export const contract = {
  status: oc.output(githubAppStatusSchema),
  repositories: oc.output(githubAppRepositoriesSchema),
} as const;
