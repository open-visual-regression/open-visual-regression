import { oc } from "@orpc/contract";
import { z } from "zod";

export const updateAccountInformationInputSchema = z.object({
  name: z.string().min(1, "you must enter a name"),
  email: z.email("invalid email address"),
});

export type UpdateAccountInformationInputSchema = z.infer<
  typeof updateAccountInformationInputSchema
>;

export const updatePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, "you must enter your current password"),
  newPassword: z.string().min(8, "password must be at least 8 characters"),
});

export type UpdatePasswordInputSchema = z.infer<typeof updatePasswordInputSchema>;

export const contract = {
  updateAccountInformation: oc.input(updateAccountInformationInputSchema),
  updatePassword: oc.input(updatePasswordInputSchema),
} as const;
