import { z } from "zod";

export const createAccountSchema = z
  .object({
    name: z.string().min(1, "name is required"),
    password: z.string().min(8, "password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
