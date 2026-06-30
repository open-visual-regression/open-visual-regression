import { isAPIError } from "better-auth/api";

import { auth } from "./auth";

export type SafeAuthResult<TData> = [error: Error, data: null] | [error: null, data: TData];

export type UpdateUserInput = {
  name: string;
  headers: Headers;
};

export type ChangeEmailInput = {
  email: string;
  headers: Headers;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  headers: Headers;
};

export type CreateInvitationInput = {
  email: string;
  organizationId: string;
  headers: Headers;
};

export type RemoveMemberInput = {
  email: string;
  organizationId: string;
  headers: Headers;
};

export type CancelInvitationInput = {
  invitationId: string;
  headers: Headers;
};

export type SignUpEmailInput = {
  name: string;
  email: string;
  password: string;
};

export type SignInEmailInput = {
  email: string;
  password: string;
};

export type AcceptInvitationInput = {
  invitationId: string;
  headers: Headers;
};

const safeAuth = async <TData>(promise: Promise<TData>): Promise<SafeAuthResult<TData>> => {
  try {
    return [null, await promise];
  } catch (error) {
    if (isAPIError(error) || error instanceof Error) {
      return [error, null];
    }

    throw error;
  }
};

export const updateUser = ({ name, headers }: UpdateUserInput) =>
  safeAuth(auth.api.updateUser({ body: { name }, headers }));

export const changeEmail = ({ email, headers }: ChangeEmailInput) =>
  safeAuth(auth.api.changeEmail({ body: { newEmail: email }, headers }));

export const changePassword = ({ currentPassword, newPassword, headers }: ChangePasswordInput) =>
  safeAuth(auth.api.changePassword({ body: { currentPassword, newPassword }, headers }));

export const createInvitation = ({ email, organizationId, headers }: CreateInvitationInput) =>
  safeAuth(auth.api.createInvitation({ body: { email, role: "member", organizationId }, headers }));

export const removeMember = ({ email, organizationId, headers }: RemoveMemberInput) =>
  safeAuth(auth.api.removeMember({ body: { memberIdOrEmail: email, organizationId }, headers }));

export const cancelInvitation = ({ invitationId, headers }: CancelInvitationInput) =>
  safeAuth(auth.api.cancelInvitation({ body: { invitationId }, headers }));

export const signUpEmail = ({ name, email, password }: SignUpEmailInput) =>
  safeAuth(auth.api.signUpEmail({ body: { name, email, password } }));

export const signInEmail = ({ email, password }: SignInEmailInput) =>
  auth.api.signInEmail({ body: { email, password }, asResponse: true });

export const acceptInvitation = ({ invitationId, headers }: AcceptInvitationInput) =>
  safeAuth(auth.api.acceptInvitation({ body: { invitationId }, headers }));
