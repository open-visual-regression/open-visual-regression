import { oc } from "@orpc/contract";
import { z } from "zod";

export const organizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
});

export type OrganizationDto = z.infer<typeof organizationSchema>;

export const getOrganizationOutputSchema = z.object({
  organization: organizationSchema,
});

export const getOrganizationContract = oc.output(getOrganizationOutputSchema);

export const updateOrganizationInputSchema = z.object({
  name: z
    .string()
    .min(1, "you must enter an organization name")
    .max(255, "the organization name must be less than 255 characters"),
});

export type UpdateOrganizationInputSchema = z.infer<typeof updateOrganizationInputSchema>;

export const updateOrganizationContract = oc.input(updateOrganizationInputSchema).output(z.void());

export const contract = {
  getOne: getOrganizationContract,
  update: updateOrganizationContract,
} as const;
