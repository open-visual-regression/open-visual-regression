import { oc } from "@orpc/contract";
import { z } from "zod";

export const getObjectInputSchema = z.object({
  path: z.string().min(1),
});

export const getObjectOutputSchema = z.object({
  status: z.literal(302),
  headers: z.object({ location: z.string() }),
});

export const getObjectContract = oc
  .route({ method: "GET", path: "/{+path}", outputStructure: "detailed" })
  .input(getObjectInputSchema)
  .output(getObjectOutputSchema);

export const contract = {
  getObject: getObjectContract,
} as const;
