import { z } from "zod";

export const updateOrganizationFormSchema = z.object({
  name: z
    .string()
    .min(1, "you must enter an organization name")
    .max(255, "the organization name must be less than 255 characters"),
});

export type UpdateOrganizationFormValues = z.infer<typeof updateOrganizationFormSchema>;
