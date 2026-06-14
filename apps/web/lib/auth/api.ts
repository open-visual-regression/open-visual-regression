import { isAPIError } from "better-auth/api";
import { auth } from "./auth";

export type SafeAuthResult<TData> = [error: Error, data: null] | [error: null, data: TData];

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

export const authServerClient = {
  updateUser: (input: { name: string; headers: Headers }) =>
    safeAuth(auth.api.updateUser({ body: { name: input.name }, headers: input.headers })),

  changeEmail: (input: { email: string; headers: Headers }) =>
    safeAuth(auth.api.changeEmail({ body: { newEmail: input.email }, headers: input.headers })),

  changePassword: (input: { currentPassword: string; newPassword: string; headers: Headers }) =>
    safeAuth(
      auth.api.changePassword({
        body: { currentPassword: input.currentPassword, newPassword: input.newPassword },
        headers: input.headers,
      }),
    ),
};
