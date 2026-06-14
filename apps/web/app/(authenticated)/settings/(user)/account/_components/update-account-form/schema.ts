import { z } from "zod";

export const updateAccountFormSchema = z.object({
  name: z.string().min(1, "you must enter a name"),
  email: z.email("invalid email address"),
});

export type UpdateAccountFormValues = z.infer<typeof updateAccountFormSchema>;
