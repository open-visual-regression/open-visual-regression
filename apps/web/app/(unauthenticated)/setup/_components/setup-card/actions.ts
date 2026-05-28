"use server";

import { redirect } from "next/navigation";
import { router } from "@/lib/router";
import { type SetupFormValues } from "./schema";
import { Result } from "@/lib/types";

export const createAdminAccount = async (values: SetupFormValues): Promise<Result<never>> => {
  const [error] = await router.setup.exec(values);

  if (error) {
    return { status: "error", error: error.message };
  }

  redirect("/login");
};
