import { oc } from "@orpc/contract";
import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  status: z.enum(["active", "invited"]),
  createdAt: z.date(),
  lastLoginAt: z.date().nullable(),
  invitationUrl: z.string().nullable(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const listUsersOutputSchema = z.object({
  users: z.array(userSchema),
});

export const inviteUserInputSchema = z.object({
  email: z.email("invalid email address"),
});

export type InviteUserInputSchema = z.infer<typeof inviteUserInputSchema>;

export const inviteUserOutputSchema = z.object({
  invitationUrl: z.string(),
});

export const contract = {
  list: oc.output(listUsersOutputSchema),
  invite: oc.input(inviteUserInputSchema).output(inviteUserOutputSchema),
} as const;
