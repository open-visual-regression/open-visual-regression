import { unstable_cache, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { rpc } from "@/lib/rpc";
import type { Result } from "@/lib/types";

export const SETUP_CACHE_TAG = "setup-status";

export const getIsSetupComplete = unstable_cache(
  async () => {
    const { count } = await rpc.setup.getUserCount();
    return count > 0;
  },
  [SETUP_CACHE_TAG],
  { tags: [SETUP_CACHE_TAG], revalidate: false },
);

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

    const slug = input.orgName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await auth.api.createOrganization({
      body: { name: input.orgName, slug },
      headers: { cookie: `better-auth.session_token=${signUpResponse.token}` },
    });

    revalidateTag(SETUP_CACHE_TAG, {});

    return { status: "ok", data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "setup failed";
    return { status: "error", error: message };
  }
};
