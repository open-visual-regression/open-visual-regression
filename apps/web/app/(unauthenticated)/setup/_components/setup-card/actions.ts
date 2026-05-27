"use server";

import { redirect } from "next/navigation";
import { createAdminAndOrg } from "@/lib/services/setup";
import { setupSchema, type SetupFormValues } from "./schema";

type ActionError = { error: string };

export const createAdminAccount = async (
  values: SetupFormValues,
): Promise<ActionError | undefined> => {
  const parsed = setupSchema.safeParse(values);

  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    return { error: issue?.message ?? "invalid form data" };
  }

  const result = await createAdminAndOrg(parsed.data);

  if (result.status === "error") {
    return { error: result.error };
  }

  redirect("/login");
};
