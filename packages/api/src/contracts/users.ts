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
});

export type ActiveUserSchema = z.infer<typeof activeUserSchema>;

export const invitedUserSchema = baseUserSchema.extend({
  status: z.literal("invited"),
  invitationUrl: z.string(),
});

export type InvitedUserSchema = z.infer<typeof invitedUserSchema>;

export const userSchema = z.discriminatedUnion("status", [activeUserSchema, invitedUserSchema]);

export type UserSchema = z.infer<typeof userSchema>;

export const listUsersInputSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt", "status"]).default("name"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListUsersInputSchema = z.infer<typeof listUsersInputSchema>;

export const listUsersOutputSchema = z.object({
  users: z.array(userSchema),
  total: z.number().int().nonnegative(),
});

export const inviteUserInputSchema = z.object({
  email: z.email("invalid email address"),
});

export type InviteUserInputSchema = z.infer<typeof inviteUserInputSchema>;

export const inviteUserOutputSchema = z.object({
  invitationUrl: z.string(),
});

export const removeUserInputSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("active"), email: z.email() }),
  z.object({ status: z.literal("invited"), invitationId: z.string() }),
]);

export type RemoveUserInputSchema = z.infer<typeof removeUserInputSchema>;

export const removeUsersInputSchema = z.object({
  users: z.array(removeUserInputSchema).min(1),
});

export const changeRoleInputSchema = z.object({
  userId: z.string(),
  role: z.enum(["user", "admin"]),
});

export type ChangeRoleInputSchema = z.infer<typeof changeRoleInputSchema>;

export const contract = {
  list: oc.input(listUsersInputSchema.optional()).output(listUsersOutputSchema),
  invite: oc.input(inviteUserInputSchema).output(inviteUserOutputSchema),
  remove: oc.input(removeUsersInputSchema),
  changeRole: oc.input(changeRoleInputSchema),
} as const;
