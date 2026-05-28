import { z } from "zod";

export const setupSchema = z
  .object({
    organizationName: z.string().min(1, "organization name is required"),
    name: z.string().min(1, "name is required"),
    email: z.email("invalid email address"),
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

export type SetupFormValues = z.infer<typeof setupSchema>;
