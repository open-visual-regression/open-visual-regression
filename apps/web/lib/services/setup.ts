import { auth } from "@/lib/auth";

type SetupInput = {
  orgName: string;
  name: string;
  email: string;
  password: string;
};

type SetupSuccess = { success: true };
type SetupFailure = { success: false; error: string };
type SetupResult = SetupSuccess | SetupFailure;

export const createAdminAndOrg = async (input: SetupInput): Promise<SetupResult> => {
  try {
    const signUpResponse = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    });

    if (!signUpResponse) {
      return { success: false, error: "failed to create admin account" };
    }

    await auth.api.createOrganization({
      body: {
        name: input.orgName,
        slug: input.orgName.toLowerCase().replace(/\s+/g, "-"),
      },
      headers: new Headers({
        cookie: `better-auth.session_token=${signUpResponse.token}`,
      }),
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "setup failed";
    return { success: false, error: message };
  }
};
