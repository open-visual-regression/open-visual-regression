import { oc } from "@orpc/contract";
import { z } from "zod";

const healthCheckStatusSchema = z.enum(["ok", "error"]);

export const healthCheckOutputSchema = z.object({
  status: z.literal("ok"),
  checks: z.object({
    db: healthCheckStatusSchema,
    redis: healthCheckStatusSchema,
  }),
});

export const healthCheckContract = oc
  .route({ method: "GET", path: "/" })
  .output(healthCheckOutputSchema);

export const contract = {
  check: healthCheckContract,
} as const;
