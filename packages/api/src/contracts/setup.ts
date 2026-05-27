import { oc } from "@orpc/contract";
import { z } from "zod";

const setupStatusSchema = z.enum(["pending", "completed"]);

export const getSetupStatusOutputSchema = z.object({ status: setupStatusSchema });

export const getSetupStatusContract = oc.output(getSetupStatusOutputSchema);

export const contract = {
  status: getSetupStatusContract,
} as const;
