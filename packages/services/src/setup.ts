import { getOrganizationCount } from "@ovr/db/repository/organizations";
import { getUserCount } from "@ovr/db/repository/users";

type SetupStatus = "complete" | "incomplete";

export const getSetupStatus = async (): Promise<SetupStatus> => {
  const [organizationCount, userCount] = await Promise.all([
    getOrganizationCount(),
    getUserCount(),
  ]);
  return organizationCount > 0 && userCount > 0 ? "complete" : "incomplete";
};
