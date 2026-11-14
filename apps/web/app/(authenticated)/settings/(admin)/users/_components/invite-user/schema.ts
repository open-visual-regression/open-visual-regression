import { z } from "zod";

export const inviteUserFormSchema = z.object({
  email: z.email("Invalid email address"),
});

export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;
