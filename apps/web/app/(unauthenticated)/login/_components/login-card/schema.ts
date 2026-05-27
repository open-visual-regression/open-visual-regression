import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("invalid email address"),
  password: z.string().min(1, "you must enter your password"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
