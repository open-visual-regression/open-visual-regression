import { oc } from "@orpc/contract";
import { z } from "zod";

export const getInvitationInputSchema = z.object({
  invitationId: z.string(),
});

export const getInvitationOutputSchema = z.object({
  email: z.string(),
  organizationName: z.string(),
  role: z.string().nullable(),
  expiresAt: z.date(),
  hasAccount: z.boolean(),
});

export type GetInvitationOutputSchema = z.infer<typeof getInvitationOutputSchema>;

export const acceptInvitationInputSchema = z.object({
  invitationId: z.string(),
});

export const contract = {
  getInvitation: oc.input(getInvitationInputSchema).output(getInvitationOutputSchema),
  acceptInvitation: oc.input(acceptInvitationInputSchema),
} as const;
