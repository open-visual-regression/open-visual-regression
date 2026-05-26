"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminAndOrg } from "@/lib/services/setup";
import { setupSchema, type SetupFormValues } from "./schema";

type ActionError = { error: string };

export const createAdminAccount = async (values: SetupFormValues): Promise<ActionError> => {
  const parsed = setupSchema.safeParse(values);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "invalid form data" };
  }

  const result = await createAdminAndOrg(parsed.data);

  if (result.status === "error") {
    return { error: result.error };
  }

  const cookieStore = await cookies();

  cookieStore.set("ovr_setup_complete", "1", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });

  redirect("/projects");
};
