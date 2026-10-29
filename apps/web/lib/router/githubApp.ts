"use server";

import { getGithubAppStatus } from "@ovr/git-status/githubApp/status";

import { adminMiddleware, authenticatedMiddleware } from "./middleware";
import { os } from "./os";

export const status = os.githubApp.status
  .use(authenticatedMiddleware)
  .use(adminMiddleware)
  .handler(() => getGithubAppStatus())
  .actionable();
