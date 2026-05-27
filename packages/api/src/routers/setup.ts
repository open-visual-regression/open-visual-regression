import { db } from "@ovr/db";
import { os } from "./os";

export const status = os.setup.status
  .handler(async () => {
    const [organizationCount, userCount] = await Promise.all([
      db.organizations.getOrganizationCount(),
      db.users.getUserCount(),
    ]);

    const status = organizationCount > 0 && userCount > 0 ? "completed" : "pending";

    return { status };
  })
  .actionable();
