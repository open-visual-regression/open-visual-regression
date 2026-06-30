"server only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";

import { Result } from "../types";

type Role = "admin" | "user";

export const verifyRole = async (role: Role): Promise<Result<boolean>> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    return { status: "ok", data: session?.user.role === role };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Failed to verify the user's role",
    };
  }
};
