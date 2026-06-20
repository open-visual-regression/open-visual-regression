import { oc } from "@orpc/contract";
import { z } from "zod";

export const snapshotLogSchema = z.object({
  id: z.uuidv7(),
  level: z.string().min(1),
  message: z.string(),
  timestamp: z.string().nonempty(),
});

export const snapshotSchema = z.object({
  id: z.uuidv7(),
  browser: z.string().min(1),
  viewportWidth: z.number().int(),
  viewportHeight: z.number().int().nullable(),
  targetName: z.string(),
  targetTitle: z.string(),
  imagePath: z.string().nullable(),
  errorLogs: z.array(snapshotLogSchema),
});

export const getOneInputSchema = z.object({ snapshotId: z.uuidv7() });

export const getOneOutputSchema = z.object({ snapshot: snapshotSchema });

export const getOneContract = oc.input(getOneInputSchema).output(getOneOutputSchema);

export const contract = {
  getOne: getOneContract,
} as const;
