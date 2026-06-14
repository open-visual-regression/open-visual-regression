"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";
import { callAuthApi } from "../auth/api";
import { auth } from "../auth/auth";
import { authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const updateProfileInformation = os.profile.updateProfileInformation
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const { user, headers } = context;

    if (input.name !== user.name) {
      const result = await callAuthApi(
        auth.api.updateUser({ body: { name: input.name }, headers }),
      );

      if (result.status === "error") {
        throw new ORPCError("BAD_REQUEST", { message: result.error.message });
      }
    }

    if (input.email !== user.email) {
      const existingUser = await dbClient.users.findByEmail(input.email);

      if (existingUser && existingUser.id !== user.id) {
        throw new ORPCError("CONFLICT", { message: "this email is already in use" });
      }

      const result = await callAuthApi(
        auth.api.changeEmail({ body: { newEmail: input.email }, headers }),
      );

      if (result.status === "error") {
        throw new ORPCError("BAD_REQUEST", { message: result.error.message });
      }
    }
  })
  .actionable();

export const updatePassword = os.profile.updatePassword
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const { headers } = context;

    const result = await callAuthApi(
      auth.api.changePassword({
        body: { currentPassword: input.currentPassword, newPassword: input.newPassword },
        headers,
      }),
    );

    if (result.status === "error") {
      throw new ORPCError("BAD_REQUEST", { message: result.error.message });
    }
  })
  .actionable();
