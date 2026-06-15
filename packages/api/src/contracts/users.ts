import { oc } from "@orpc/contract";
import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string().nullable(),
  createdAt: z.date(),
  lastLoginAt: z.date().nullable(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const listUsersOutputSchema = z.object({
  users: z.array(userSchema),
});

export const contract = {
  list: oc.output(listUsersOutputSchema),
} as const;
