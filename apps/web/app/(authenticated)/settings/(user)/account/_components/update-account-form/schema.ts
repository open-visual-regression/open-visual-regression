import { z } from "zod";

export const updateAccountFormSchema = z.object({
  name: z.string().min(1, "You must enter a name"),
  email: z.email("Invalid email address"),
});

export type UpdateAccountFormValues = z.infer<typeof updateAccountFormSchema>;
