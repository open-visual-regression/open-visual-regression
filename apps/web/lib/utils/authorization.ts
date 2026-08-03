"server only";

import { type Role } from "@/lib/auth/roles";
import { getCachedSession } from "@/lib/auth/session";

import { Result } from "../types";

export const verifyRole = async (role: Role): Promise<Result<boolean>> => {
  try {
    const session = await getCachedSession();

    return { status: "ok", data: session?.user.role === role };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Failed to verify the user's role",
    };
  }
};
