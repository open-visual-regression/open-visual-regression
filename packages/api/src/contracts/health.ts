import { oc } from "@orpc/contract";
import { z } from "zod";

const healthCheckStatusSchema = z.enum(["ok", "error"]);

export const healthCheckBodySchema = z.object({
  status: healthCheckStatusSchema,
  checks: z.object({
    db: healthCheckStatusSchema,
    redis: healthCheckStatusSchema,
  }),
});

export const healthCheckOutputSchema = z.object({
  status: z.union([z.literal(200), z.literal(503)]),
  body: healthCheckBodySchema,
});

export const healthCheckContract = oc
  .route({ method: "GET", path: "/", outputStructure: "detailed" })
  .output(healthCheckOutputSchema);

export const contract = {
  check: healthCheckContract,
} as const;
