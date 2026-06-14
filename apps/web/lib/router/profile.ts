"use server";

import { ORPCError } from "@orpc/client";
import { dbClient } from "@ovr/db/client";
import { authClient } from "../auth/api";
import { authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const updateProfileInformation = os.profile.updateProfileInformation
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const { user, headers } = context;

    if (input.name !== user.name) {
      const [error] = await authClient.updateUser({ name: input.name, headers });

      if (error) {
        throw new ORPCError("BAD_REQUEST", { message: error.message });
      }
    }

    if (input.email !== user.email) {
      const existingUser = await dbClient.users.findByEmail(input.email);

      if (existingUser && existingUser.id !== user.id) {
        throw new ORPCError("CONFLICT", { message: "this email is already in use" });
      }

      const [error] = await authClient.changeEmail({ email: input.email, headers });

      if (error) {
        throw new ORPCError("BAD_REQUEST", { message: error.message });
      }
    }
  })
  .actionable();

export const updatePassword = os.profile.updatePassword
  .use(authenticatedMiddleware)
  .handler(async ({ input, context }) => {
    const { headers } = context;

    const [error] = await authClient.changePassword({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      headers,
    });

    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
  })
  .actionable();
