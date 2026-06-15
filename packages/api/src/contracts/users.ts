import { oc } from "@orpc/contract";
import { z } from "zod";

const baseUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  createdAt: z.date(),
});

export const activeUserSchema = baseUserSchema.extend({
  status: z.literal("active"),
  lastLoginAt: z.date().nullable(),
});

export type ActiveUserSchema = z.infer<typeof activeUserSchema>;

export const invitedUserSchema = baseUserSchema.extend({
  status: z.literal("invited"),
  invitationUrl: z.string(),
});

export type InvitedUserSchema = z.infer<typeof invitedUserSchema>;

export const userSchema = z.discriminatedUnion("status", [activeUserSchema, invitedUserSchema]);

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
