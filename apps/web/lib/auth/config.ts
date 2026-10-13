import { z } from "zod";

import { ROLES } from "./roles";

const ENV_VARS = {
  mode: "OVR_AUTH_MODE",
  tokenHeader: "OVR_AUTH_PROXY_TOKEN_HEADER",
  issuer: "OVR_AUTH_PROXY_ISSUER",
  audience: "OVR_AUTH_PROXY_AUDIENCE",
  signer: "OVR_AUTH_PROXY_SIGNER",
  algorithms: "OVR_AUTH_PROXY_ALGORITHMS",
  jwksUrl: "OVR_AUTH_PROXY_JWKS_URL",
  keyUrl: "OVR_AUTH_PROXY_KEY_URL",
  emailClaim: "OVR_AUTH_PROXY_EMAIL_CLAIM",
  nameClaim: "OVR_AUTH_PROXY_NAME_CLAIM",
  groupsClaim: "OVR_AUTH_PROXY_GROUPS_CLAIM",
  roleGroups: "OVR_AUTH_ROLE_GROUPS",
  logoutUrl: "OVR_AUTH_PROXY_LOGOUT_URL",
  accessRequestUrl: "OVR_AUTH_ACCESS_REQUEST_URL",
  organizationName: "OVR_ORGANIZATION_NAME",
  tokenIdleDays: "OVR_AUTH_TOKEN_IDLE_DAYS",
} as const;

const ALGORITHMS = [
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
  "ES256",
  "ES384",
  "ES512",
  "EdDSA",
] as const;

const KEY_ID_PLACEHOLDER = "{kid}";

const required = { error: "is required" };

const urlSchema = z.url({ error: "must be a URL" });

const roleGroupsSchema = z
  .string(required)
  .transform((value, ctx) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "must be valid JSON" });
      return z.NEVER;
    }
  })
  .pipe(
    z.partialRecord(z.enum(ROLES), z.array(z.string().min(1)), {
      error: `must map ${ROLES.join(", ")} to lists of group names`,
    }),
  );

const algorithmsSchema = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((algorithm) => algorithm.trim())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(z.enum(ALGORITHMS, { error: `must only list ${ALGORITHMS.join(", ")}` }))
      .min(1, { error: "must list at least one algorithm" }),
  )
  .default(["RS256", "ES256"]);

const modeSchema = z
  .enum(["local", "trusted-proxy-shadow", "trusted-proxy"], {
    error: "must be local, trusted-proxy-shadow or trusted-proxy",
  })
  .refine((mode) => mode !== "trusted-proxy", { error: "trusted-proxy is not supported yet" })
  .default("local");

const trustedProxySchema = z
  .object({
    tokenHeader: z.string(required),
    issuer: urlSchema,
    audience: z.string().optional(),
    signer: z.string().optional(),
    algorithms: algorithmsSchema,
    jwksUrl: urlSchema.optional(),
    keyUrl: z
      .string()
      .includes(KEY_ID_PLACEHOLDER, { error: `must contain ${KEY_ID_PLACEHOLDER}` })
      .optional(),
    emailClaim: z.string().default("email"),
    nameClaim: z.string().default("name"),
    groupsClaim: z.string().default("groups"),
    roleGroups: roleGroupsSchema,
    logoutUrl: urlSchema.optional(),
    accessRequestUrl: urlSchema.optional(),
    organizationName: z.string().default("OVR"),
    tokenIdleDays: z.coerce
      .number({ error: "must be a number of days" })
      .int({ error: "must be a whole number of days" })
      .positive({ error: "must be at least 1" })
      .default(7),
  })
  .refine((config) => Boolean(config.jwksUrl) !== Boolean(config.keyUrl), {
    error: `or ${ENV_VARS.keyUrl} is required, but not both`,
    path: ["jwksUrl"],
  });

export type TrustedProxyConfig = z.infer<typeof trustedProxySchema>;

export type AuthConfig =
  | { mode: "local" }
  | ({ mode: "trusted-proxy-shadow" | "trusted-proxy" } & TrustedProxyConfig);

export class InvalidAuthConfigError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    super(
      issues
        .map((issue) => {
          const key = issue.path[0] as keyof typeof ENV_VARS | undefined;
          return `${key ? ENV_VARS[key] : "auth config"} ${issue.message}`;
        })
        .join("; "),
    );
    this.name = "InvalidAuthConfigError";
  }
}

const readEnv = (): Partial<Record<keyof typeof ENV_VARS, string>> =>
  Object.fromEntries(
    Object.entries(ENV_VARS).map(([key, name]) => [key, process.env[name] || undefined]),
  );

const parse = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new InvalidAuthConfigError(result.error.issues);
  }

  return result.data;
};

export const getAuthConfig = (): AuthConfig => {
  const env = readEnv();
  const mode = parse(z.object({ mode: modeSchema }), env).mode;

  if (mode === "local") {
    return { mode };
  }

  return { mode, ...parse(trustedProxySchema, env) };
};

export const usesTrustedProxy = (): boolean => getAuthConfig().mode === "trusted-proxy";

export const getSignOutUrl = (): string => {
  const config = getAuthConfig();

  return config.mode === "trusted-proxy" && config.logoutUrl ? config.logoutUrl : "/login";
};

export const assertAuthConfig = (): void => {
  getAuthConfig();
};
