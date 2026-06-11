import { oc } from "@orpc/contract";
import { z } from "zod";

const setupStatusSchema = z.enum(["pending", "completed"]);

export const getSetupStatusOutputSchema = z.object({ status: setupStatusSchema });

export const getSetupStatusContract = oc.output(getSetupStatusOutputSchema);

export const execSetupInputSchema = z.object({
  organizationName: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

export type ExecSetupInputSchema = z.infer<typeof execSetupInputSchema>;

export const execSetupContract = oc.input(execSetupInputSchema);

export const contract = {
  status: getSetupStatusContract,
  exec: execSetupContract,
} as const;
