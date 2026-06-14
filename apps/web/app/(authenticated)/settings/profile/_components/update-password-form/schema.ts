import { z } from "zod";

export const updatePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "you must enter your current password"),
    newPassword: z.string().min(8, "password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>;
