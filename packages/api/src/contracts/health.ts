import { oc } from "@orpc/contract";
import { z } from "zod";

const dependencyStatusSchema = z.enum(["ok", "error"]);

export const livenessOutputSchema = z.object({
  status: z.literal("ok"),
});

export const readinessOutputSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  checks: z.object({
    db: dependencyStatusSchema,
    redis: dependencyStatusSchema,
  }),
});

export const livenessContract = oc.route({ method: "GET" }).output(livenessOutputSchema);

export const readinessContract = oc.route({ method: "GET" }).output(readinessOutputSchema);

export const contract = {
  live: livenessContract,
  ready: readinessContract,
} as const;
