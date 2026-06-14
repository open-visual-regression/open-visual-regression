import { isAPIError, type APIError } from "better-auth/api";

export type AuthResult<TData> =
  | { status: "success"; data: TData }
  | { status: "error"; error: APIError };

export const callAuthApi = async <TData>(promise: Promise<TData>): Promise<AuthResult<TData>> => {
  try {
    return { status: "success", data: await promise };
  } catch (error) {
    if (isAPIError(error)) {
      return { status: "error", error };
    }

    throw error;
  }
};
