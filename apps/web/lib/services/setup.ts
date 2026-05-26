import { auth } from "@/lib/auth";
import type { Result } from "@/lib/types";

export type SetupInput = {
  orgName: string;
  name: string;
  email: string;
  password: string;
};

export const createAdminAndOrg = async (input: SetupInput): Promise<Result<null>> => {
  try {
    const signUpResponse = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    });

    if (!signUpResponse?.token) {
      return { status: "error", error: "failed to create admin account" };
    }

    await auth.api.createOrganization({
      body: {
        name: input.orgName,
        slug: input.orgName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      },
      headers: { cookie: `better-auth.session_token=${signUpResponse.token}` },
    });

    return { status: "ok", data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "setup failed";
    return { status: "error", error: message };
  }
};
