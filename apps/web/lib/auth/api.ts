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
