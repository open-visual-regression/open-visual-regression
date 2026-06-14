"use server";

import { os } from "./os";
import { authenticatedMiddleware, adminMiddleware } from "./middleware";
import { dbClient } from "@ovr/db/client";

export const list = os.users.list
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(async () => {
    const users = await dbClient.users.findAll();

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
    };
  })
  .actionable();
