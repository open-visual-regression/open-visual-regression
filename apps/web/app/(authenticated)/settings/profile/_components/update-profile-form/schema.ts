import { z } from "zod";

export const updateProfileFormSchema = z.object({
  name: z.string().min(1, "you must enter a name"),
  email: z.email("invalid email address"),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileFormSchema>;
