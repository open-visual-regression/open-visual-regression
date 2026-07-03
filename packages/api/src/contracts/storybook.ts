import { oc } from "@orpc/contract";
import { z } from "zod";

export const getStorybookFileInputSchema = z.object({
  buildId: z.uuidv7(),
  path: z.string().min(1),
});

export const getStorybookFileOutputSchema = z.object({
  status: z.literal(200),
  headers: z.object({
    "content-type": z.string(),
    "cache-control": z.string(),
  }),
  body: z.custom<ReadableStream>(),
});

export const getStorybookFileContract = oc
  .route({ method: "GET", path: "/{buildId}/{+path}", outputStructure: "detailed" })
  .input(getStorybookFileInputSchema)
  .output(getStorybookFileOutputSchema);

export const contract = {
  getStorybookFile: getStorybookFileContract,
} as const;
