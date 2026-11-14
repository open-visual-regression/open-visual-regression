import { z } from "zod";

export const updateOrganizationFormSchema = z.object({
  name: z
    .string()
    .min(1, "You must enter an organization name")
    .max(255, "The organization name must be less than 255 characters"),
});

export type UpdateOrganizationFormValues = z.infer<typeof updateOrganizationFormSchema>;
